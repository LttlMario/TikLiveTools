const assert=require('node:assert/strict');
const {ActionEngine,matches}=require('../src/actions');

(async()=>{
  const messages=[];
  const scenes=[];
  const engine=new ActionEngine({
    getRules:async()=>[],
    broadcast:message=>messages.push(message),
    obs:{setScene:async scene=>scenes.push(scene)},
    getTtsSettings:async()=>({voice:'ro-RO-AlinaNeural',rate:1})
  });
  const event={type:'gift',uniqueId:'viewer_1',displayName:'Viewer One',giftName:'Rose',coins:5,comment:'hello'};
  await engine.run([
    {type:'overlay',url:'action-screen',screen:2,duration:5},
    {type:'tts',text:'Mulțumesc {username} pentru {gift}, {coins} coins'},
    {type:'sound',name:'Gift alert',url:'/uploads/sounds/gift.mp3',volume:.7},
    {type:'obs_scene',scene:'LIVE Scene'}
  ],event);
  assert.equal(messages[0].type,'action');
  assert.equal(messages[0].action.payload.variables.username,'Viewer One');
  assert.equal(messages[1].type,'tts');
  assert.equal(messages[1].screen,0);
  assert.equal(messages[1].text,'Mulțumesc Viewer One pentru Rose, 5 coins');
  assert.deepEqual(messages[1].settings,{voice:'ro-RO-AlinaNeural',rate:1});
  assert.equal(messages[2].type,'sound');
  assert.equal(messages[2].screen,0);
  assert.equal(messages[2].sound.url,'/uploads/sounds/gift.mp3');
  assert.equal(messages[2].sound.volume,.7);
  assert.deepEqual(scenes,['LIVE Scene']);

  assert.equal(matches({enabled:1,trigger_type:'gift',trigger_config:{uniqueId:'VIEWER_1',giftName:'rose',minCoins:5}},{...event}),true);
  assert.equal(matches({enabled:1,trigger_type:'chat',trigger_config:{textContains:'hello'}},{type:'chat',comment:'HELLO everyone'}),true);
  assert.equal(matches({enabled:1,trigger_type:'gift',trigger_config:{minCoins:6}},{...event}),false);

  let runs=0;
  const cooldownEngine=new ActionEngine({getRules:async()=>[{id:10,enabled:1,trigger_type:'follow',trigger_config:{},actions:[{type:'overlay',url:'follow'}],cooldown_seconds:60}],broadcast:()=>{runs++}});
  await cooldownEngine.process({type:'follow',uniqueId:'viewer_1'});
  await cooldownEngine.process({type:'follow',uniqueId:'viewer_1'});
  assert.equal(runs,1,'cooldown must suppress repeated action for the same viewer');
  console.log('TikLiveTools actions tests passed');
})().catch(error=>{console.error(error);process.exit(1)});
