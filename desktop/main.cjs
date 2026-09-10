const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { createServer } = require('node:net');
const fs = require('node:fs');
const path = require('node:path');

let windowRef;
let mcpChild;
let mcpClient;
let localPort;
let localSecret;

const tokenFile = () => path.join(app.getPath('userData'), 'meta-token.bin');
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); }
  catch { return { accountId: 'act_281413939226359' }; }
}

function saveSettings(settings) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
}

function readToken() {
  if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(tokenFile())) return null;
  try { return safeStorage.decryptString(fs.readFileSync(tokenFile())); }
  catch { return null; }
}

async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function serverEntry() {
  return path.join(app.getAppPath(), 'dist', 'index.js');
}

async function stopServer() {
  if (mcpClient) await mcpClient.close().catch(() => {});
  mcpClient = null;
  if (mcpChild) mcpChild.kill();
  mcpChild = null;
  localPort = null;
  localSecret = null;
}

async function startServer() {
  if (mcpClient) return mcpClient;
  const metaToken = readToken();
  if (!metaToken) throw new Error('Configure um token Meta para conectar.');
  localPort = await freePort();
  localSecret = randomBytes(40).toString('hex');
  const executable = process.execPath;
  mcpChild = spawn(executable, [serverEntry(), '--http', '--port', String(localPort)], {
    windowsHide: true,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      MCP_HOST: '127.0.0.1',
      MCP_BASE_URL: `http://127.0.0.1:${localPort}`,
      MCP_SERVER_TOKEN: localSecret,
      MCP_PERMISSIONS: 'read',
      META_ACCESS_TOKEN: metaToken,
      META_API_VERSION: 'v24.0',
      DATABASE_URL: '',
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let startupError = '';
  mcpChild.stderr.on('data', chunk => {
    const clean = String(chunk).split(metaToken).join('[OCULTO]').split(localSecret).join('[OCULTO]');
    startupError = (startupError + clean).slice(-3000);
  });
  mcpChild.once('exit', () => { mcpClient = null; mcpChild = null; });
  const base = `http://127.0.0.1:${localPort}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(base + '/health')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) { await stopServer(); throw new Error('O MCP local não iniciou. ' + startupError); }
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  mcpClient = new Client({ name: 'meta-ads-pratinho-desktop', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(base + '/mcp'), {
    requestInit: { headers: { Authorization: `Bearer ${localSecret}` } },
  });
  await mcpClient.connect(transport);
  return mcpClient;
}

function extractJson(result) {
  const text = (result.content || []).filter(item => item.type === 'text').map(item => item.text).join('\n');
  if (result.isError) throw new Error(text.replace(/```[\s\S]*?```/g, '').trim() || 'Erro na API Meta.');
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) throw new Error('A Meta retornou uma resposta inesperada.');
  const parsed = JSON.parse(match[1]);
  if (parsed.error) throw new Error(parsed.error.message || 'Erro na API Meta.');
  return parsed;
}

async function readAll(endpoint, params) {
  const client = await startServer();
  const rows = [];
  let after;
  do {
    const response = await client.callTool({
      name: 'execute_api',
      arguments: { method: 'GET', endpoint, params: { ...params, limit: 100, ...(after ? { after } : {}) } },
    });
    const data = extractJson(response);
    if (Array.isArray(data.data)) rows.push(...data.data);
    else if (data.data) rows.push(data.data);
    after = data.paging?.next ? data.paging?.cursors?.after : undefined;
  } while (after);
  return rows;
}

function actionValue(row, type, field = 'actions') {
  return Number((row[field] || []).find(item => item.action_type === type)?.value || 0);
}

function buildDashboard(campaigns, insights, period) {
  const byId = new Map(insights.map(row => [row.campaign_id, row]));
  const rows = campaigns.map(campaign => {
    const metric = byId.get(campaign.id) || {};
    const spend = Number(metric.spend || 0);
    const impressions = Number(metric.impressions || 0);
    const linkClicks = Number(metric.inline_link_clicks || 0);
    const purchases = actionValue(metric, 'offsite_conversion.fb_pixel_purchase') || actionValue(metric, 'omni_purchase');
    const checkout = actionValue(metric, 'omni_initiated_checkout');
    const revenue = actionValue(metric, 'offsite_conversion.fb_pixel_purchase', 'action_values') || actionValue(metric, 'omni_purchase', 'action_values');
    return {
      id: campaign.id, name: campaign.name, status: campaign.effective_status || campaign.status,
      objective: campaign.objective, spend, impressions, linkClicks,
      ctr: impressions ? linkClicks / impressions * 100 : 0,
      cpc: linkClicks ? spend / linkClicks : null,
      checkout, purchases, cpa: purchases ? spend / purchases : null,
      revenue, roas: revenue && spend ? revenue / spend : null,
    };
  }).sort((a, b) => b.spend - a.spend);
  const totals = rows.reduce((sum, row) => ({
    spend: sum.spend + row.spend, impressions: sum.impressions + row.impressions,
    linkClicks: sum.linkClicks + row.linkClicks, checkout: sum.checkout + row.checkout,
    purchases: sum.purchases + row.purchases, revenue: sum.revenue + row.revenue,
  }), { spend: 0, impressions: 0, linkClicks: 0, checkout: 0, purchases: 0, revenue: 0 });
  totals.cpa = totals.purchases ? totals.spend / totals.purchases : null;
  totals.roas = totals.revenue && totals.spend ? totals.revenue / totals.spend : null;
  return { period, rows, totals, updatedAt: new Date().toISOString() };
}

ipcMain.handle('app:status', async () => ({
  tokenConfigured: Boolean(readToken()), connected: Boolean(mcpClient),
  accountId: loadSettings().accountId, readOnly: true,
}));

ipcMain.handle('app:save-token', async (_event, token) => {
  if (typeof token !== 'string' || !/^EA[A-Za-z0-9_-]{40,}$/.test(token.trim())) throw new Error('Token Meta inválido ou incompleto.');
  if (!safeStorage.isEncryptionAvailable()) throw new Error('A criptografia do Windows não está disponível.');
  fs.mkdirSync(path.dirname(tokenFile()), { recursive: true });
  fs.writeFileSync(tokenFile(), safeStorage.encryptString(token.trim()));
  await stopServer();
  return { saved: true };
});

ipcMain.handle('app:save-account', async (_event, accountId) => {
  const normalized = String(accountId || '').trim().replace(/^act_/, '');
  if (!/^\d{5,30}$/.test(normalized)) throw new Error('ID da conta inválido.');
  saveSettings({ accountId: 'act_' + normalized });
  return { accountId: 'act_' + normalized };
});

ipcMain.handle('app:test', async () => {
  const client = await startServer();
  const tools = await client.listTools();
  const accounts = await readAll('me/adaccounts', { fields: 'id,name,account_status,currency' });
  return { connected: true, toolCount: tools.tools.length, accounts };
});

ipcMain.handle('app:dashboard', async (_event, period = 'last_30d') => {
  const accountId = loadSettings().accountId;
  const campaigns = await readAll(accountId + '/campaigns', { fields: 'id,name,status,effective_status,objective,created_time,start_time,stop_time' });
  const insights = await readAll(accountId + '/insights', {
    fields: 'campaign_id,campaign_name,spend,impressions,inline_link_clicks,actions,action_values,purchase_roas',
    level: 'campaign', date_preset: period, use_unified_attribution_setting: true,
  });
  return buildDashboard(campaigns, insights, period);
});

function createWindow() {
  windowRef = new BrowserWindow({
    width: 1320, height: 850, minWidth: 980, minHeight: 650,
    backgroundColor: '#f6f3ec', title: 'Meta Ads — Pratinho Pronto',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  windowRef.setMenuBarVisibility(false);
  windowRef.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (mcpChild) mcpChild.kill(); });
