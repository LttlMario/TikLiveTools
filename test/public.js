const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const out=path.join(root,'dist-pages');
assert.ok(fs.existsSync(path.join(out,'index.html')),'public build must contain the full application shell');
assert.ok(fs.existsSync(path.join(out,'app.js')),'public build must contain the application script');
assert.ok(fs.existsSync(path.join(out,'app.css')),'public build must contain the application stylesheet');
assert.ok(fs.existsSync(path.join(out,'tts-edge.js')),'public build must contain the Neural TTS enhancement');
assert.ok(fs.existsSync(path.join(out,'assets','gifts','manifest.json')),'public build must contain gift assets');
assert.equal(fs.readFileSync(path.join(out,'CNAME'),'utf8').trim(),'live.panel-pro.ro','public build must target the configured domain');
for(const slug of ['firework','gift-cannon','gift-battle','gift-browser','coin-jar','top-likes','timer','wheel','song-requests','challenge','halving']){
  const file=path.join(out,'overlay',slug,'index.html');
  assert.ok(fs.existsSync(file),`public overlay route missing: ${slug}`);
  assert.match(fs.readFileSync(file,'utf8'),/advanced\.js/);
}
console.log('TikLiveTools public build tests passed');
