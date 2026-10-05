const $=id=>document.getElementById(id);
let count=0;
const base=location.origin;
const overlays=[['Top Likes','top-likes'],['Top Coins','top-coins'],['Coin Jar','coin-jar'],['Alerts','alerts'],['Goals','goals'],['Leaderboard','leaderboard'],['Chat','chat'],['Gift Battle','gift-battle']];
function overlayCard([label,name]){const url=`${base}/overlay/${name}`;return `<article class="overlay-card"><div class="overlay-head"><strong>${label}</strong><span>${name}</span></div><div class="preview-label">Previzualizare live</div><iframe title="Previzualizare ${label}" src="${url}"></iframe><div class="overlay-actions"><button data-test="gift" data-name="${name}">Test gift</button><button data-test="like" data-name="${name}">Test like</button><button data-test="follow" data-name="${name}">Test follow</button><button class="secondary" onclick="navigator.clipboard.writeText('${url}')">Copiază link</button><a class="open-preview" href="${url}" target="_blank">Deschide</a></div><code>${url}</code></article>`}
$('overlayList').innerHTML=overlays.map(overlayCard).join('');
async function sendTest(type){const payload=type==='gift'?{type:'gift',displayName:'Preview Viewer',uniqueId:'preview_viewer',giftName:'Rose',coins:5,quantity:1}:type==='like'?{type:'like',displayName:'Preview Liker',uniqueId:'preview_liker',quantity:100}:{type:'follow',displayName:'Preview Follower',uniqueId:'preview_follower'};await fetch('/api/test-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})}
document.querySelectorAll('[data-test]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;await sendTest(button.dataset.test);setTimeout(()=>button.disabled=false,500)}));
async function refresh(){try{const r=await fetch('/api/status');const s=await r.json();$('dbBadge').textContent=s.db?'DB online':'DB offline';$('liveBadge').textContent=s.connected?'TikTok conectat':'TikTok offline';if(s.username)$('username').value=s.username}catch(e){$('dbBadge').textContent='DB offline'}}
refresh();
$('connect').onclick=async()=>{const username=$('username').value.trim();const r=await fetch('/api/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})});const x=await r.json();$('log').textContent=x.ok?'Conectat. Aștept evenimente reale...':x.error;refresh()};
$('disconnect').onclick=async()=>{await fetch('/api/disconnect',{method:'POST'});$('log').textContent='Deconectat.';refresh()};
const ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='event'){count++;$('eventCount').textContent=count;$('log').textContent=`${m.event.type}: ${m.event.displayName||m.event.uniqueId||''}`}};
