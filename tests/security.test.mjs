import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:net';
import {checkPermission} from '../dist/auth/permissions.js';
import {redactSecrets} from '../dist/utils/redact-secrets.js';
import {handleApiTool} from '../dist/api-tools.js';

test('read-only denies mutation tools, unknown tools and non-GET API calls',()=>{
  for(const tool of ['create_campaign','activate_campaign','update_budget_schedule','future_write_tool']) assert.equal(checkPermission(tool,'read'),false);
  for(const method of ['POST','DELETE','PUT','PATCH']) assert.equal(checkPermission('execute_api','read',method),false);
  assert.equal(checkPermission('execute_api','read','GET'),true);
  assert.equal(checkPermission('list_campaigns','read'),true);
});

test('stdio honors MCP_PERMISSIONS=read', async()=>{
  const previous=process.env.MCP_PERMISSIONS;
  process.env.MCP_PERMISSIONS='read';
  try {
    const denied=await handleApiTool('create_campaign',{});
    assert.equal(denied.isError,true);
    assert.match(denied.content[0].text,/Permission denied/);
    const override=await handleApiTool('execute_api',{method:'GET',endpoint:'123',params:{method:'DELETE'}});
    assert.equal(override.isError,true);
    assert.match(override.content[0].text,/Permission denied/);
  } finally {
    if(previous===undefined) delete process.env.MCP_PERMISSIONS;
    else process.env.MCP_PERMISSIONS=previous;
  }
});

test('redacts nested tokens, error strings and pagination credentials',()=>{
  const secret='invented-token-for-tests';
  const clean=redactSecrets({access_token:secret,error:{message:`failure ${secret}`},paging:{next:'https://graph.facebook.com/?access_token=another-secret&after=cursor'},rows:[{client_secret:'test'}]},[secret]);
  assert.equal(JSON.stringify(clean).includes(secret),false);
  assert.equal(JSON.stringify(clean).includes('another-secret'),false);
  assert.equal(clean.rows[0].client_secret,'[REDACTED]');
  assert.equal(clean.paging.next.includes('after=cursor'),true);
});

test('HTTP single-tenant authenticates without DB and blocks writes', {timeout:25000}, async()=>{
  const socket=createServer(); await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));
  const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
  const secret='test-only-mcp-server-secret-1234567890';
  const metaSecret='test-only-meta-credential';
  const child=spawn(process.execPath,['dist/index.js','--http','--port',String(port)],{env:{...process.env,DATABASE_URL:'',MCP_SERVER_TOKEN:secret,META_ACCESS_TOKEN:metaSecret,MCP_PERMISSIONS:'read',MCP_BASE_URL:`http://127.0.0.1:${port}`},stdio:['ignore','pipe','pipe']});
  let logs='';child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>logs+=chunk);
  const base=`http://127.0.0.1:${port}`;
  try {
    let ready=false;
    for(let attempt=0;attempt<100;attempt++){try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await delay(100);}
    assert.equal(ready,true,logs);
    const initialize={jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'security-test',version:'1'}}};
    const headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
    for(const route of ['/mcp','/']) for(const auth of ['',`Bearer ${metaSecret}`,'Bearer wrong-secret']) {
      const response=await fetch(base+route,{method:'POST',headers:{...headers,...(auth?{Authorization:auth}:{})},body:JSON.stringify(initialize)});
      assert.equal(response.status,401);
    }
    assert.equal((await fetch(base+'/.well-known/oauth-authorization-server')).status,404);
    assert.equal((await fetch(base+'/oauth/register',{method:'POST',headers,body:'{}'})).status,404);
    const response=await fetch(base+'/mcp',{method:'POST',headers:{...headers,Authorization:`Bearer ${secret}`},body:JSON.stringify(initialize)});
    assert.equal(response.status,200);
    const session=response.headers.get('mcp-session-id'); assert.ok(session);
    await response.text();
    const denied=await fetch(base+'/mcp',{method:'POST',headers:{...headers,Authorization:`Bearer ${secret}`,'Mcp-Session-Id':session},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'update_budget_schedule',arguments:{}}})});
    const body=await denied.text();assert.match(body,/permission|read.only|denied|permiss/i);
    const override=await fetch(base+'/mcp',{method:'POST',headers:{...headers,Authorization:`Bearer ${secret}`,'Mcp-Session-Id':session},body:JSON.stringify({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'execute_api',arguments:{method:'GET',endpoint:'123',params:{method:'DELETE'}}}})});
    assert.match(await override.text(),/Permission denied/);
    assert.equal(logs.includes(secret),false);assert.equal(logs.includes(metaSecret),false);
  } finally { child.kill(); }
});
