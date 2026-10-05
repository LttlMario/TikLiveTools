const assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
async function get(path){const r=await fetch(base+path);assert.equal(r.ok,true,`${path} returned ${r.status}`);return r.json()}
async function post(path,body){const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body||{})});assert.equal(r.ok,true,`${path} returned ${r.status}`);return r.json()}
(async()=>{
  const status=await get('/api/status');
  assert.equal(status.db,true,'MariaDB is not connected');
  const hotkeys=await get('/api/hotkeys');assert.ok(hotkeys.bindings['1'],'global hotkey bridge must expose bindings');
  const manifest=await get('/assets/gifts/manifest.json');
  assert.equal(manifest.length,966,'Gift manifest must contain 966 assets');
  for(const path of ['/api/rules','/api/goals','/api/chat/commands','/api/songs','/api/sounds','/api/overlays'])assert.ok(Array.isArray(await get(path)),`${path} must return an array`);
  assert.ok(status.roomStats&&Array.isArray(status.roomStats.topGifters),'status must expose room statistics');
  for(const slug of ['top-likes','top-coins','top-gifters','coin-jar','gift-battle','firework','snow','win-goal','gift-feed','gift-cannon','like-fountain','song-requests','viewer-count']){const r=await fetch(`${base}/overlay/${slug}`);assert.equal(r.status,200,`overlay ${slug} unavailable`)}
  const wheel=await post('/api/games/wheel/start',{options:['Smoke A','Smoke B']});const spun=await post(`/api/games/${wheel.id}/spin`,{});assert.ok(['Smoke A','Smoke B'].includes(spun.game.state.result),'wheel spin must return configured option');await post(`/api/games/${wheel.id}/finish`,{});
  const timer=await post('/api/games/timer/start',{durationSeconds:30});const overlay=await get('/api/overlay/timer/data');assert.ok((overlay.games||[]).some(x=>Number(x.id)===Number(timer.id)),'timer must appear in overlay state');await post(`/api/games/${timer.id}/finish`,{});
  const drop=await post('/api/games/drop/start',{dropPoints:7});await post('/api/test-event',{type:'chat',uniqueId:'smoke_drop_user',comment:'hello'});await post('/api/test-event',{type:'chat',uniqueId:'smoke_drop_user',comment:'hello'});const dropState=await get('/api/games/drop');const parsedDrop=typeof dropState.state==='string'?JSON.parse(dropState.state):dropState.state;assert.equal(Number(parsedDrop.score),7,'points drop must award once per viewer');await post(`/api/games/${drop.id}/finish`,{});
  const nextSong=await post('/api/songs/next',{});assert.ok(Object.prototype.hasOwnProperty.call(nextSong,'id'),'song next endpoint must return queue state');
  console.log('TikLiveTools smoke tests passed');
})().catch(error=>{console.error(error);process.exit(1)})
