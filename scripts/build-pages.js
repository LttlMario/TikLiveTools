const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const out=path.join(root,'dist-pages');
const overlayDir=path.join(out,'overlays');
const routeDir=path.join(out,'overlay');
const assetsDir=path.join(out,'assets');
const slugs=[
  'firework','gift-cannon','gift-battle','gift-browser','top-likes','top-coins','coin-jar','alerts','goals','leaderboard',
  'win-goal','countdown-goal','follower-count','gift-count','last-follower','last-liker','last-gifter',
  'gift-feed','like-fountain','likeathon','penalty-battle','coin-match','points-animation','user-info',
  'command-info','action-screen','interaction-slider','drop','song-requests','viewer-count','stream-buddies',
  'timer','wheel','top-gifters','challenge','halving','snow','social','emojify'
];

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(overlayDir,{recursive:true});
fs.mkdirSync(routeDir,{recursive:true});
fs.mkdirSync(assetsDir,{recursive:true});
for(const file of ['index.html','app.css','app.js','ui-enhancements.js','tts-edge.js'])fs.copyFileSync(path.join(root,'public',file),path.join(out,file));
fs.cpSync(path.join(root,'public','assets'),assetsDir,{recursive:true});
for(const file of ['advanced.js','advanced.css'])fs.copyFileSync(path.join(root,'public','overlays',file),path.join(overlayDir,file));
const html='<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TikLiveTools Overlay</title><link rel="stylesheet" href="../../overlays/advanced.css"></head><body><main id="app"></main><script src="../../overlays/advanced.js"></script></body></html>';
for(const slug of slugs){const dir=path.join(routeDir,slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html)}
const links=slugs.map(slug=>`<li><a href="overlay/${slug}/">${slug}</a></li>`).join('');
fs.writeFileSync(path.join(out,'CNAME'),'live.panel-pro.ro');
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log(`Built ${slugs.length} public overlay routes in ${path.relative(root,out)}`);
