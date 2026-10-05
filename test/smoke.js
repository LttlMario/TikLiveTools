const assert=require('node:assert/strict');
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
async function get(path){const r=await fetch(base+path);assert.equal(r.ok,true,`${path} returned ${r.status}`);return r.json()}
(async()=>{
  const status=await get('/api/status');
  assert.equal(status.db,true,'MariaDB is not connected');
  const manifest=await get('/assets/gifts/manifest.json');
  assert.equal(manifest.length,966,'Gift manifest must contain 966 assets');
  for(const path of ['/api/rules','/api/goals','/api/chat/commands','/api/songs','/api/sounds','/api/overlays'])assert.ok(Array.isArray(await get(path)),`${path} must return an array`);
  for(const slug of ['top-likes','top-coins','coin-jar','gift-battle','firework','snow']){const r=await fetch(`${base}/overlay/${slug}`);assert.equal(r.status,200,`overlay ${slug} unavailable`)}
  console.log('TikLiveTools smoke tests passed');
})().catch(error=>{console.error(error);process.exit(1)})
