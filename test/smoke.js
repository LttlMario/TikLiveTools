const assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
async function get(path){const r=await fetch(base+path);assert.equal(r.ok,true,`${path} returned ${r.status}`);return r.json()}
async function post(path,body){const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body||{})});assert.equal(r.ok,true,`${path} returned ${r.status}`);return r.json()}
async function expectStatus(path,body,status){const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body||{})});assert.equal(r.status,status,`${path} expected ${status}, got ${r.status}`);return r.json()}
(async()=>{
  const status=await get('/api/status');
  assert.equal(status.db,true,'MariaDB is not connected');
  const spotify=await get('/api/spotify/status');assert.equal(typeof spotify.configured,'boolean','Spotify status must be available');
  const hotkeys=await get('/api/hotkeys');assert.ok(hotkeys.bindings['1'],'global hotkey bridge must expose bindings');
  const manifest=await get('/assets/gifts/manifest.json');
  assert.equal(manifest.length,966,'Gift manifest must contain 966 assets');
  for(const path of ['/api/rules','/api/goals','/api/chat/commands','/api/songs','/api/sounds','/api/overlays'])assert.ok(Array.isArray(await get(path)),`${path} must return an array`);
  assert.ok(status.roomStats&&Array.isArray(status.roomStats.topGifters),'status must expose room statistics');
  const connectError=await expectStatus('/api/connect',{username:'smoke_user'},400);assert.match(connectError.error,/sessionid|session/i,'TikTok must require local sessionid instead of a remote signer');
  const goal=await post('/api/goals',{name:'Smoke likes goal',goalType:'likes',target:999,currentValue:0,resetMode:'manual'});await post('/api/test-event',{type:'like',uniqueId:'smoke_goal_user',quantity:3});const goals=await get('/api/goals');assert.ok(goals.some(g=>Number(g.id)===Number(goal.id)&&Number(g.current_value)>=3),'likes must update goal state');await fetch(`${base}/api/goals/${goal.id}`,{method:'DELETE'});
  const command=await post('/api/chat/commands',{commandName:'!smoke',responseText:'Salut {username}',requiredRole:'everyone',cooldownSeconds:1,actions:[]});assert.ok((await get('/api/chat/commands')).some(c=>Number(c.id)===Number(command.id)),'chat command must persist');await fetch(`${base}/api/chat/commands/${command.id}`,{method:'DELETE'});
  const sound=await post('/api/sounds',{name:'Smoke sound',triggerType:'gift',triggerConfig:{minCoins:1},filePath:'/uploads/sounds/smoke.mp3'});assert.ok((await get('/api/sounds')).some(s=>Number(s.id)===Number(sound.id)),'sound alert must persist');await fetch(`${base}/api/sounds/${sound.id}`,{method:'DELETE'});
  await post('/api/overlays',{slug:'smoke-overlay',title:'Smoke Overlay',config:{animation:'pulse'}});assert.ok((await get('/api/overlays')).some(o=>o.slug==='smoke-overlay'),'overlay config must persist');const overlayDelete=await fetch(`${base}/api/overlays/smoke-overlay`,{method:'DELETE'});assert.equal(overlayDelete.status,200,'overlay config must be deletable');
  for(const slug of ['top-likes','top-coins','top-gifters','coin-jar','gift-battle','firework','snow','win-goal','gift-feed','gift-cannon','like-fountain','song-requests','viewer-count']){const r=await fetch(`${base}/overlay/${slug}`);assert.equal(r.status,200,`overlay ${slug} unavailable`)}
  const wheel=await post('/api/games/wheel/start',{options:['Smoke A','Smoke B']});const spun=await post(`/api/games/${wheel.id}/spin`,{});assert.ok(['Smoke A','Smoke B'].includes(spun.game.state.result),'wheel spin must return configured option');await post(`/api/games/${wheel.id}/finish`,{});
  const timer=await post('/api/games/timer/start',{durationSeconds:30});const overlay=await get('/api/overlay/timer/data');assert.ok((overlay.games||[]).some(x=>Number(x.id)===Number(timer.id)),'timer must appear in overlay state');await post(`/api/games/${timer.id}/finish`,{});
  const drop=await post('/api/games/drop/start',{dropPoints:7});await post('/api/test-event',{type:'chat',uniqueId:'smoke_drop_user',comment:'hello'});await post('/api/test-event',{type:'chat',uniqueId:'smoke_drop_user',comment:'hello'});const dropState=await get('/api/games/drop');const parsedDrop=typeof dropState.state==='string'?JSON.parse(dropState.state):dropState.state;assert.equal(Number(parsedDrop.score),7,'points drop must award once per viewer');await post(`/api/games/${drop.id}/finish`,{});
  const nextSong=await post('/api/songs/next',{});assert.ok(Object.prototype.hasOwnProperty.call(nextSong,'id'),'song next endpoint must return queue state');
  console.log('TikLiveTools smoke tests passed');
})().catch(error=>{console.error(error);process.exit(1)})
