const assert=require('node:assert/strict');
const WebSocket=require('ws');
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
async function request(path,body,method='POST'){const r=await fetch(base+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();assert.equal(r.ok,true,path+' returned '+r.status);return data}
(async()=>{
  await request('/api/settings',{ttsSettings:JSON.stringify({voice:'ro-RO-AlinaNeural',rate:1,pitch:1,volume:1})});
  const rule=await request('/api/rules',{name:'ws-smoke-'+Date.now(),triggerType:'gift',triggerConfig:{minCoins:2},actions:[{type:'tts',text:'Salut {username}'},{type:'overlay',url:'gift',screen:3}],cooldownSeconds:2});
  const messages=[];const ws=new WebSocket(base.replace('http','ws')+'/ws');ws.on('message',x=>messages.push(JSON.parse(x)));
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});
  await request('/api/test-event',{type:'gift',uniqueId:'ws_smoke_user',displayName:'WS Smoke',giftName:'Rose',coins:2});
  await request('/api/test-event',{type:'gift',uniqueId:'ws_smoke_user',displayName:'WS Smoke',giftName:'Rose',coins:2});
  await new Promise(resolve=>setTimeout(resolve,350));
  await request('/api/rules/'+rule.id,undefined,'DELETE');ws.close();
  assert.ok(messages.some(x=>x.type==='event'&&x.event?.type==='gift'),'WebSocket must broadcast live events');
  assert.ok(messages.some(x=>x.type==='tts'&&x.text.includes('WS Smoke')),'rules must trigger TTS over WebSocket');
  assert.ok(messages.some(x=>x.type==='tts'&&x.text==='Salut WS Smoke'&&x.settings?.voice==='ro-RO-AlinaNeural'),'TTS event must carry the saved Neural voice');
  assert.equal(messages.filter(x=>x.type==='tts'&&x.text==='Salut WS Smoke').length,1,'rule cooldown must suppress duplicate actions');
  assert.ok(messages.some(x=>x.type==='action'&&x.action?.url==='gift'&&Number(x.action?.screen)===3),'rules must trigger screen-targeted overlay actions over WebSocket');
  console.log('TikLiveTools WebSocket integration test passed');
})().catch(error=>{console.error(error);process.exit(1)});
