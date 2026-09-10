const $ = selector => document.querySelector(selector);
let dashboardRows = [];
const money = value => value == null ? '—' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const number = value => new Intl.NumberFormat('pt-BR').format(value || 0);
const decimal = value => value == null ? '—' : value.toFixed(2);
function busy(value){ $('#refreshBtn').disabled=value;$('#testBtn').disabled=value; }
function message(target,text){const el=$(target);el.textContent=text;el.classList.toggle('hidden',!text)}
function renderRows(rows){
  const query=$('#search').value.trim().toLowerCase();
  const visible=rows.filter(row=>row.name.toLowerCase().includes(query));
  $('#campaignRows').innerHTML=visible.length?visible.map(row=>`<tr><td class="campaign-name"></td><td class="status-${row.status==='ACTIVE'?'active':'paused'}">${row.status==='ACTIVE'?'Ativa':'Pausada'}</td><td>${money(row.spend)}</td><td>${number(row.impressions)}</td><td>${decimal(row.ctr)}%</td><td>${money(row.cpc)}</td><td>${number(row.checkout)}</td><td>${number(row.purchases)}</td><td>${money(row.cpa)}</td><td>${decimal(row.roas)}</td></tr>`).join(''):'<tr><td colspan="10" class="empty">Nenhuma campanha encontrada.</td></tr>';
  [...document.querySelectorAll('.campaign-name')].forEach((cell,index)=>cell.textContent=visible[index].name);
}
function render(data){dashboardRows=data.rows;$('#spend').textContent=money(data.totals.spend);$('#purchases').textContent=number(data.totals.purchases);$('#cpa').textContent=money(data.totals.cpa);$('#roas').textContent=decimal(data.totals.roas);$('#checkouts').textContent=number(data.totals.checkout);$('#updated').textContent='Atualizado em '+new Date(data.updatedAt).toLocaleString('pt-BR');renderRows(dashboardRows)}
async function refresh(){busy(true);message('#message','');try{const data=await window.metaAds.dashboard($('#period').value);render(data);$('#status').textContent='Conectado • leitura';$('#status').className='pill ok'}catch(error){message('#message',error.message);$('#status').textContent='Atenção';$('#status').className='pill warn'}finally{busy(false)}}
async function init(){const status=await window.metaAds.status();$('#accountId').value=status.accountId;$('#status').textContent=status.tokenConfigured?'Token configurado':'Configure o token';$('#status').className='pill '+(status.tokenConfigured?'neutral':'warn');if(status.tokenConfigured)refresh()}
$('#settingsBtn').addEventListener('click',()=>$('#settingsDialog').showModal());
$('#refreshBtn').addEventListener('click',refresh);$('#period').addEventListener('change',refresh);$('#search').addEventListener('input',()=>renderRows(dashboardRows));
$('#settingsForm').addEventListener('submit',async event=>{event.preventDefault();busy(true);message('#settingsMessage','');try{await window.metaAds.saveAccount($('#accountId').value);const token=$('#token').value.trim();if(token)await window.metaAds.saveToken(token);$('#token').value='';$('#settingsDialog').close();await refresh()}catch(error){message('#settingsMessage',error.message)}finally{busy(false)}});
$('#testBtn').addEventListener('click',async()=>{busy(true);message('#settingsMessage','');try{await window.metaAds.saveAccount($('#accountId').value);const token=$('#token').value.trim();if(token){await window.metaAds.saveToken(token);$('#token').value=''}const result=await window.metaAds.test();message('#settingsMessage',`Conectado. ${result.toolCount} ferramentas e ${result.accounts.length} conta(s) acessível(is).`)}catch(error){message('#settingsMessage',error.message)}finally{busy(false)}});
init();
