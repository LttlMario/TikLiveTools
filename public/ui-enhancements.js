(() => {
  const $ = id => document.getElementById(id);
  const apiCall = (url, options) => fetch(url, options).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Request failed'); return data; });
  const field = (parent, id, type, placeholder, value='') => { if ($(id)) return $(id); const input=document.createElement(type==='select'?'select':'input'); input.id=id; input.placeholder=placeholder; input.value=value; if(type!=='select') input.type=type; parent.insertBefore(input, $('ruleCreate')||$('soundCreate')||$('commandCreate')||$('songAdd')); return input; };

  function enhanceActions(){
    const button=$('ruleCreate'); if(!button||button.dataset.enhanced)return; button.dataset.enhanced='1';
    const grid=button.parentElement, type=document.createElement('select'); type.id='ruleActionType'; type.innerHTML='<option value="tts">TTS</option><option value="sound">Sound alert</option><option value="overlay">Overlay action</option><option value="obs_scene">OBS scene</option><option value="webhook">Webhook</option>'; grid.insertBefore(type,button);
    const value=document.createElement('input');value.id='ruleActionValue';value.placeholder='Text / URL / scenă / slug';grid.insertBefore(value,button);
    button.onclick=async()=>{try{const v=value.value.trim(),action={type:type.value};if(type.value==='tts')action.text=v||'{username}';else if(type.value==='sound'){action.url=v;action.volume=1}else if(type.value==='obs_scene')action.scene=v;else action.url=v;await apiCall('/api/rules',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('ruleName').value||'Regulă nouă',triggerType:$('ruleTrigger').value,triggerConfig:{minCoins:Number($('ruleMinCoins').value||0)},actions:[action],cooldownSeconds:Number($('ruleCooldown').value||0)})});if(typeof loadRules==='function')loadRules()}catch(e){alert(e.message)}};
  }
  function enhanceSounds(){
    const button=$('soundCreate');if(!button||button.dataset.enhanced)return;button.dataset.enhanced='1';const grid=button.parentElement,trigger=document.createElement('select');trigger.id='soundTrigger';trigger.innerHTML='<option value="gift">Gift</option><option value="follow">Follow</option><option value="like">Like</option><option value="share">Share</option><option value="chat">Chat</option>';grid.insertBefore(trigger,button);button.onclick=async()=>{try{await apiCall('/api/sounds',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('soundName').value||'Sound alert',triggerType:trigger.value,triggerConfig:{},filePath:$('soundUrl').value})});if(typeof loadSounds==='function')loadSounds()}catch(e){alert(e.message)}};
  }
  function enhanceCommands(){
    const button=$('commandCreate');if(!button||button.dataset.enhanced)return;button.dataset.enhanced='1';const grid=button.parentElement,cost=document.createElement('input');cost.id='commandCooldown';cost.type='number';cost.min='0';cost.value='0';cost.placeholder='Cooldown secunde';grid.insertBefore(cost,button);button.onclick=async()=>{try{await apiCall('/api/chat/commands',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({commandName:$('commandName').value,responseText:$('commandResponse').value,requiredRole:$('commandRole').value,cooldownSeconds:Number(cost.value||0),actions:[]})});if(typeof loadCommands==='function')loadCommands()}catch(e){alert(e.message)}};
  }
  function enhanceSongs(){
    const button=$('songAdd');if(!button||button.dataset.enhanced)return;button.dataset.enhanced='1';const grid=button.parentElement,cost=document.createElement('input');cost.id='songCost';cost.type='number';cost.min='0';cost.value='0';cost.placeholder='Cost în points';grid.insertBefore(cost,button);button.onclick=async()=>{try{await apiCall('/api/songs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:$('songTitle').value,artist:$('songArtist').value,externalUrl:$('songUrl').value,pointsCost:Number(cost.value||0)})});if(typeof loadSongs==='function')loadSongs()}catch(e){alert(e.message)}};
  }
  function enhanceObs(){
    const button=$('obsConnect');if(!button||button.dataset.enhanced)return;button.dataset.enhanced='1';const grid=button.parentElement,url=document.createElement('input');url.id='obsUrl';url.value='ws://127.0.0.1:4455';url.placeholder='URL OBS WebSocket';grid.insertBefore(url,button);button.onclick=async()=>{try{const x=await apiCall('/api/obs/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.value,password:$('obsPassword').value})});$('obsLog').textContent=`OBS conectat • ${x.scenes.length} scene`;if(typeof refresh==='function')refresh()}catch(e){$('obsLog').textContent=e.message}};
  }
  function run(){enhanceActions();enhanceSounds();enhanceCommands();enhanceSongs();enhanceObs();}
  window.addEventListener('hashchange',run);run();
})();
