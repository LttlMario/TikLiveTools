const path=require('path');
const fs=require('fs');
const http=require('http');
const express=require('express');
const WebSocket=require('ws');
const multer=require('multer');
require('dotenv').config();
const db=require('./db');
const migrate=require('./migrate');
const TikTokService=require('./tiktok');
const ObsService=require('./obs');
const HotkeyService=require('./hotkeys');
const {ActionEngine}=require('./actions');
const DiscordNotifier=require('./discord');
const SpotifyService=require('./spotify');

const app=express();
const soundDir=path.join(__dirname,'..','public','uploads','sounds');fs.mkdirSync(soundDir,{recursive:true});
const dataDir=path.join(__dirname,'..','data');fs.mkdirSync(dataDir,{recursive:true});
const giftCacheFile=path.join(dataDir,'gifts-catalog.json');
let cachedGifts=[];try{cachedGifts=JSON.parse(fs.readFileSync(giftCacheFile,'utf8'))}catch{}
const upload=multer({storage:multer.diskStorage({destination:soundDir,filename:(_req,file,cb)=>{const safe=path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g,'_');cb(null,`${Date.now()}-${safe}`)}}),limits:{fileSize:15*1024*1024},fileFilter:(_req,file,cb)=>cb(null,/^audio\//i.test(file.mimetype))});
const server=http.createServer(app);
const wss=new WebSocket.Server({server,path:'/ws'});
const clients=new Set();
const state={connected:false,obsConnected:false,username:process.env.TIKTOK_USERNAME||'',lastEvent:null,db:false,tiktokError:null,obsError:null,gifts:cachedGifts,roomStats:{viewerCount:0,topGifters:[]}};
app.use(express.json({limit:'2mb'}));
app.use((req,res,next)=>{res.set('Cache-Control','no-store');next()});
const publicOrigin=String(process.env.PUBLIC_ORIGIN||'https://live.panel-pro.ro').replace(/\/$/,'');
const secretSettingKeys=new Set(['tiktokSessionId','spotifyAccessToken','spotifyRefreshToken','spotifyTokenExpiresAt','discordWebhookUrl']);
const isPublicRequest=req=>req.headers.origin===publicOrigin;
const redactSettings=settings=>Object.fromEntries(Object.entries(settings).filter(([key])=>!secretSettingKeys.has(key)));
const redactProfiles=profiles=>profiles.map(profile=>({...profile,session_id:null}));
app.use((req,res,next)=>{if(req.headers.origin===publicOrigin){res.set('Access-Control-Allow-Origin',publicOrigin);res.set('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');res.set('Access-Control-Allow-Headers','Content-Type');}if(req.method==='OPTIONS')return res.sendStatus(204);next()});
app.use(express.static(path.join(__dirname,'..','public')));
const ttsServiceUrl=String(process.env.TTS_SERVICE_URL||'http://127.0.0.1:8770').replace(/\/$/,'');
const fallbackTtsVoices=[['ro-RO-AlinaNeural','Alina','Română','female'],['ro-RO-EmilNeural','Emil','Română','male'],['en-US-AvaMultilingualNeural','Ava','English','female'],['en-US-AndrewMultilingualNeural','Andrew','English','male'],['en-US-EmmaMultilingualNeural','Emma','English','female'],['en-US-BrianMultilingualNeural','Brian','English','male'],['en-US-JennyNeural','Jenny','English','female'],['en-US-GuyNeural','Guy','English','male'],['en-US-AriaNeural','Aria','English','female'],['en-US-ChristopherNeural','Christopher','English','male'],['en-GB-SoniaNeural','Sonia','English','female'],['en-AU-WilliamMultilingualNeural','William','English','male'],['fr-FR-DeniseNeural','Denise','Français','female'],['fr-FR-VivienneMultilingualNeural','Vivienne','Français','female'],['fr-FR-RemyMultilingualNeural','Rémy','Français','male'],['de-DE-KatjaNeural','Katja','Deutsch','female'],['de-DE-SeraphinaMultilingualNeural','Seraphina','Deutsch','female'],['de-DE-FlorianMultilingualNeural','Florian','Deutsch','male'],['es-ES-ElviraNeural','Elvira','Español','female'],['it-IT-ElsaNeural','Elsa','Italiano','female'],['it-IT-GiuseppeMultilingualNeural','Giuseppe','Italiano','male'],['pt-BR-ThalitaMultilingualNeural','Thalita','Português','female'],['ko-KR-HyunsuMultilingualNeural','Hyunsu','한국어','male']].map(([id,name,language,gender])=>({id,name,language,locale:id.slice(0,5),gender,multilingual:id.includes('Multilingual')}));
function normalizeTtsOptions(input={}){const signed=(value,unit,scale,defaultValue)=>{if(value===undefined||value===null||value==='')return defaultValue;const text=String(value).trim();if(/^[+-]?\d+(?:\.\d+)?(?:%|Hz)$/i.test(text))return /^[+-]/.test(text)?text:`+${text}`;const number=Number(text);if(Number.isFinite(number))return `${number>=1?'+':''}${Math.round((number-1)*scale)}${unit}`;return defaultValue};return {...input,rate:signed(input.rate,'%',100,'+0%'),pitch:signed(input.pitch,'Hz',5,'+0Hz'),volume:signed(input.volume,'%',100,'+0%')}}
app.get('/api/tts/voices',async(_req,res)=>{try{const r=await fetch(`${ttsServiceUrl}/voices`);if(r.ok)return res.json(await r.json())}catch{}res.json(fallbackTtsVoices)});
app.post('/api/tts/synthesize',async(req,res)=>{try{const r=await fetch(`${ttsServiceUrl}/tts`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(normalizeTtsOptions(req.body||{}))});const body=Buffer.from(await r.arrayBuffer());res.status(r.status).set('Content-Type',r.headers.get('content-type')||'application/json').send(body)}catch(error){res.status(503).json({error:'Serviciul TTS Neural local nu este pornit. Rulează start-local.ps1 pentru a-l porni.'})}});
function broadcast(message){if(message?.type==='tts'&&!message.settings){getTtsSettings().then(settings=>broadcast({...message,settings}));return}const data=JSON.stringify(message);for(const c of clients)if(c.readyState===WebSocket.OPEN)c.send(data)}
const obs=new ObsService(broadcast);
const discord=new DiscordNotifier(()=>db.getSettings());
const spotify=new SpotifyService(db);
async function getTtsSettings(){try{const settings=await db.getSettings();return JSON.parse(settings.ttsSettings||'{}')}catch{return {}}}
const actions=new ActionEngine({getRules:()=>db.getRules(),broadcast,obs,getTtsSettings});
const commandCooldowns=new Map();
const viewerRoles=new Map();
let hotkeySceneIndex=0;
async function runHotkey(action){broadcast({type:'hotkey',action});if(action==='timer_toggle'){const current=await db.getGame('timer');if(current)await db.finishGame(current.id);else await db.startGame('timer',{durationSeconds:300})}if(action==='wheel_spin'){const current=await db.getGame('wheel');if(current)await db.spinGame(current.id);else{const id=await db.startGame('wheel',{options:['Premiu 1','Premiu 2','Premiu 3','Bonus']});await db.spinGame(id)}}if(action==='song_next')await db.advanceSong();if(action==='obs_scene_next'){const scenes=await obs.getScenes();if(scenes.length){hotkeySceneIndex=(hotkeySceneIndex+1)%scenes.length;await obs.setScene(scenes[hotkeySceneIndex].sceneName)}}broadcast({type:'hotkey_done',action})}
const hotkeys=new HotkeyService(runHotkey);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{hotkeys.stop();server.close(()=>process.exit(0))});
function roleAllowed(required,event){const role=String(required||'everyone').toLowerCase();if(role==='everyone')return true;const known=viewerRoles.get(event.uniqueId)||{};if(role==='moderator')return Boolean(event.isModerator||known.moderator);if(role==='subscriber')return Boolean(event.isSubscriber||known.subscriber||known.moderator);if(role==='follower')return Boolean(event.isFollower||known.follower||known.subscriber||known.moderator);return true}
async function processAuxiliary(event){const [commands,sounds]=await Promise.all([db.listCommands(),db.listSoundAlerts()]);if(event.type==='chat'){const text=String(event.comment||'').trim();const command=text.split(/\s+/)[0].toLowerCase();const match=commands.find(c=>c.enabled&&String(c.command_name).toLowerCase()===command);if(match&&roleAllowed(match.required_role,event)){const key=`${match.id}:${event.uniqueId||'global'}`,now=Date.now(),until=commandCooldowns.get(key)||0;if(until<=now){commandCooldowns.set(key,now+Number(match.cooldown_seconds||0)*1000);const response=String(match.response_text||'').replace(/\{username\}/g,event.displayName||event.uniqueId||'viewer').replace(/\{comment\}/g,event.comment||'');broadcast({type:'chat_response',command:match.command_name,response,event});if(response){broadcast({type:'tts',text:response});if(state.connected&&!event.payload?.test)await tiktok.sendMessage(response).catch(error=>broadcast({type:'chat_send_error',message:error.message}))}await actions.run(match.actions,event)}}}for(const sound of sounds){const c=sound.triggerConfig||{};if(!sound.enabled||sound.trigger_type!==event.type)continue;if(c.giftName&&String(c.giftName).toLowerCase()!==String(event.giftName||'').toLowerCase())continue;if(c.minCoins&&Number(event.coins||0)<Number(c.minCoins))continue;broadcast({type:'sound',sound:{id:sound.id,name:sound.name,url:sound.file_path,volume:Number(sound.volume||1)},event})}}
async function processEvent(event,{previewOnly=false}={}){state.lastEvent=event;if(!previewOnly&&event.uniqueId){const r=viewerRoles.get(event.uniqueId)||{};if(event.type==='follow')r.follower=true;if(event.type==='subscribe')r.subscriber=true;if(event.isModerator)r.moderator=true;if(event.isSubscriber)r.subscriber=true;viewerRoles.set(event.uniqueId,r)}try{if(state.db&&!previewOnly){await db.saveEvent(event);await db.upsertViewer(event);await db.applyEventToGoals(event);await db.applyEventToGames(event);await actions.process(event);await processAuxiliary(event);if(!event.payload?.test)await discord.event(event)}}catch(error){broadcast({type:'database_error',message:error.message})}broadcast({type:'event',event})}
const tiktok=new TikTokService(processEvent,status=>{Object.assign(state,status);if(status.connected)state.tiktokError=null;else if(status.error||status.reason)state.tiktokError=String(status.error||status.reason);broadcast({type:'status',status:{...state}})},gifts=>{if(Array.isArray(gifts)&&gifts.length){state.gifts=gifts;try{fs.writeFileSync(giftCacheFile,JSON.stringify(gifts))}catch{}}else if(!state.connected)state.gifts=cachedGifts;broadcast({type:'gifts',gifts:state.gifts})});
wss.on('connection',client=>{clients.add(client);client.send(JSON.stringify({type:'state',state}));client.on('close',()=>clients.delete(client))});
app.get('/api/status',(_q,r)=>r.json(state));
app.get('/api/health',async(_q,r)=>{
  let tts=false;
  try{const probe=await fetch(`${ttsServiceUrl}/voices`,{signal:AbortSignal.timeout(1500)});tts=probe.ok}catch{}
  const result={ok:Boolean(state.db),database:state.db,tiktok:state.connected,tiktokError:state.tiktokError||null,obs:state.obsConnected,obsError:state.obsError||null,tts,uptimeSeconds:Math.floor(process.uptime()),lastEventType:state.lastEvent?.type||null};
  r.status(result.ok?200:503).json(result);
});
app.get('/api/hotkeys',(_q,r)=>r.json({enabled:Boolean(hotkeys.proc),bindings:{1:'Ctrl+Alt+F1 • Timer',2:'Ctrl+Alt+F2 • Wheel Spin',3:'Ctrl+Alt+F3 • Next Song',4:'Ctrl+Alt+F4 • Next OBS Scene'}}));
app.post('/api/hotkeys/trigger',async(q,r)=>{try{await runHotkey(String(q.body.action||''));r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/gifts',(_q,r)=>r.json(state.gifts||[]));
app.post('/api/connect',async(q,r)=>{const requested=String(q.body.username||'').trim();try{const active=await db.getActiveProfile();state.username=requested||active?.tiktok_username||'';const settings=await db.getSettings();const requestedSession=String(q.body.sessionId||'').trim();const sessionId=requestedSession||String(active?.session_id||settings.tiktokSessionId||process.env.TIKTOK_SESSION_ID||'').trim();await tiktok.connect(state.username,sessionId);await db.resetStreamGoals();r.json({ok:true,state})}catch(e){state.connected=false;state.username='';r.status(400).json({ok:false,error:e.message})}});
app.post('/api/disconnect',async(_q,r)=>{await tiktok.disconnect();state.connected=false;state.tiktokError=null;state.username='';state.roomStats={viewerCount:0,topGifters:[]};viewerRoles.clear();commandCooldowns.clear();broadcast({type:'status',status:state});r.json({ok:true})});
app.post('/api/obs/connect',async(q,r)=>{try{await obs.connect(q.body.url||'ws://127.0.0.1:4455',q.body.password||'');state.obsConnected=true;state.obsError=null;r.json({ok:true,scenes:await obs.getScenes()})}catch(e){state.obsConnected=false;state.obsError=e.message;r.status(400).json({ok:false,error:e.message})}});
app.post('/api/obs/disconnect',async(_q,r)=>{await obs.disconnect();state.obsConnected=false;state.obsError=null;r.json({ok:true})});
app.get('/api/obs/scenes',async(_q,r)=>{try{r.json({scenes:await obs.getScenes()})}catch(e){r.status(400).json({error:e.message})}});
app.post('/api/obs/scene',async(q,r)=>{try{await obs.setScene(String(q.body.scene||''));r.json({ok:true,scene:q.body.scene})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/rules',async(_q,r)=>{try{r.json(await db.getRules())}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/rules',async(q,r)=>{try{const id=await db.createRule(q.body);r.json({ok:true,id})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.put('/api/rules/:id',async(q,r)=>{try{await db.updateRule(q.params.id,q.body);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.delete('/api/rules/:id',async(q,r)=>{try{await db.deleteRule(q.params.id);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/viewers/stats',async(_q,r)=>{try{r.json(await db.getViewerStats())}catch(e){r.status(500).json({error:e.message})}});
app.get('/api/viewers',async(q,r)=>{try{r.json(await db.listViewers(q.query.limit,q.query.q))}catch(e){r.status(500).json({error:e.message})}});
app.get('/api/overlay/:name/data',async(q,r)=>{try{r.json(await db.getOverlayData(q.params.name))}catch(e){r.status(500).json({error:e.message})}});
app.get('/api/profiles',async(q,r)=>{try{const profiles=await db.getProfiles();r.json(isPublicRequest(q)?redactProfiles(profiles):profiles)}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/profiles',async(q,r)=>{try{r.json({ok:true,id:await db.createProfile(q.body.name,q.body.username,q.body.plan||'premium',q.body.sessionId||'')})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.post('/api/profiles/:id/activate',async(q,r)=>{try{await db.activateProfile(q.params.id);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/settings',async(q,r)=>{try{const settings=await db.getSettings();r.json(isPublicRequest(q)?redactSettings(settings):settings)}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/settings',async(q,r)=>{try{for(const [key,value] of Object.entries(q.body))await db.saveSetting(key,value);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/goals',async(_q,r)=>{try{r.json(await db.listGoals())}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/goals',async(q,r)=>{try{r.json({ok:true,id:await db.saveGoal(q.body)})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.put('/api/goals/:id',async(q,r)=>{try{await db.updateGoal(q.params.id,q.body);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.delete('/api/goals/:id',async(q,r)=>{try{await db.deleteGoal(q.params.id);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/chat/commands',async(_q,r)=>{try{r.json(await db.listCommands())}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/chat/commands',async(q,r)=>{try{r.json({ok:true,id:await db.saveCommand(q.body)})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.delete('/api/chat/commands/:id',async(q,r)=>{try{await db.deleteCommand(q.params.id);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/songs',async(_q,r)=>{try{r.json(await db.listSongs())}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/songs',async(q,r)=>{try{r.json({ok:true,id:await db.addSong(q.body)})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.post('/api/songs/request',async(q,r)=>{try{r.json({ok:true,id:await db.requestSong(q.body)})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.patch('/api/songs/:id',async(q,r)=>{try{await db.updateSong(q.params.id,q.body.status);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.post('/api/songs/next',async(_q,r)=>{try{r.json({ok:true,id:await db.advanceSong()})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/spotify/status',async(_q,r)=>{try{r.json(await spotify.status())}catch(e){r.status(500).json({error:e.message})}});
app.get('/api/spotify/login',async(_q,r)=>{try{r.redirect(await spotify.authorizationUrl())}catch(e){r.status(400).json({error:e.message})}});
app.get('/api/spotify/callback',async(q,r)=>{try{await spotify.callback(String(q.query.code||''),String(q.query.state||''));r.redirect('/#song')}catch(e){r.status(400).send(`<h2>Spotify connection failed</h2><p>${String(e.message).replace(/[<>&]/g,'')}</p><a href="/#song">Înapoi</a>`)}});
app.get('/api/spotify/search',async(q,r)=>{try{r.json(await spotify.search(String(q.query.q||'')))}catch(e){r.status(400).json({error:e.message})}});
app.post('/api/spotify/queue',async(q,r)=>{try{r.json(await spotify.queue(q.body.uri))}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/sounds',async(_q,r)=>{try{r.json(await db.listSoundAlerts())}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/uploads/sound',upload.single('file'),(q,r)=>{if(!q.file)return r.status(400).json({error:'Selectează un fișier audio valid.'});r.json({ok:true,url:`/uploads/sounds/${q.file.filename}`,name:q.file.originalname})});
app.post('/api/sounds',async(q,r)=>{try{r.json({ok:true,id:await db.saveSoundAlert(q.body)})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.post('/api/sounds/:id/test',async(q,r)=>{try{const sound=(await db.listSoundAlerts()).find(x=>Number(x.id)===Number(q.params.id));if(!sound)throw new Error('Alerta audio nu există.');if(!sound.enabled)throw new Error('Alerta audio este dezactivată.');broadcast({type:'sound',sound:{id:sound.id,name:sound.name,url:sound.file_path,volume:Number(sound.volume||1)},event:{type:sound.trigger_type,previewOnly:true,displayName:'Preview Sound'}});r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.delete('/api/sounds/:id',async(q,r)=>{try{await db.deleteSoundAlert(q.params.id);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/overlays',async(_q,r)=>{try{r.json(await db.listOverlays())}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/overlays',async(q,r)=>{try{await db.saveOverlay(q.body);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.delete('/api/overlays/:slug',async(q,r)=>{try{await db.deleteOverlay(q.params.slug);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/api/games/:type',async(q,r)=>{try{r.json(await db.getGame(q.params.type))}catch(e){r.status(500).json({error:e.message})}});
app.post('/api/games/:type/start',async(q,r)=>{try{r.json({ok:true,id:await db.startGame(q.params.type,q.body||{})})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.post('/api/games/:id/spin',async(q,r)=>{try{r.json({ok:true,game:await db.spinGame(q.params.id)})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.post('/api/games/:id/finish',async(q,r)=>{try{await db.finishGame(q.params.id);r.json({ok:true})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.post('/api/test-event',async(q,r)=>{const type=q.body.type||'gift';const previewOnly=Boolean(q.body.previewOnly),event={type,uniqueId:q.body.uniqueId||'local_test',displayName:q.body.displayName||'Local test',giftName:type==='gift'?(q.body.giftName||'Rose'):null,coins:Number(q.body.coins??(type==='gift'?1:0)),quantity:Number(q.body.quantity??1),comment:q.body.comment||'',actionName:q.body.actionName||'',screen:Number(q.body.screen||1),isModerator:Boolean(q.body.isModerator),isSubscriber:Boolean(q.body.isSubscriber),isFollower:Boolean(q.body.isFollower),previewOnly,previewOverlay:String(q.body.previewOverlay||''),payload:{test:true}};try{await processEvent(event,{previewOnly});r.json({ok:true,event,previewOnly})}catch(e){r.status(400).json({ok:false,error:e.message})}});
app.get('/overlay/:name',(q,r)=>{r.sendFile(path.join(__dirname,'..','public','overlays','advanced.html'))});
let dbRetryTimer=null;
async function ensureDbReady(){if(state.db||dbRetryTimer)return;try{await db.checkDatabase();await migrate();state.db=true;broadcast({type:'status',status:state});console.log('MariaDB conectata.')}catch(e){state.db=false;console.warn('Baza MySQL nu este conectata:',e.message);dbRetryTimer=setTimeout(()=>{dbRetryTimer=null;ensureDbReady()},5000)}}
(async()=>{await ensureDbReady();const port=Number(process.env.PORT||3000);server.listen(port,()=>{hotkeys.start();let lastMinutePoints=Date.now();setInterval(async()=>{if(!state.db){ensureDbReady();return}try{await db.applyHalvingGames();broadcast({type:'game_tick',gameType:'halving'});if(state.connected&&Date.now()-lastMinutePoints>=60000){const count=await db.applyChatMinutePoints();lastMinutePoints=Date.now();if(count)broadcast({type:'points_minute',count})}}catch(e){state.db=false;broadcast({type:'database_error',message:e.message});ensureDbReady()}},10000);console.log(`TikLiveTools: http://localhost:${port}`)})})();
