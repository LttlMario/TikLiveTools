const assert=require('node:assert/strict');
const WebSocket=require('ws');
const {encode,decode}=require('@msgpack/msgpack');
const ObsService=require('../src/obs');

(async()=>{
  const server=new WebSocket.Server({port:0,handleProtocols:()=> 'obswebsocket.msgpack'});
  await new Promise(resolve=>server.once('listening',resolve));
  let nextId=0,selected='';
  server.on('connection',client=>{client.send(Buffer.from(encode({op:0,d:{obsWebSocketVersion:'5.0.0',rpcVersion:1}})));client.on('message',raw=>{
    const message=decode(raw),data=message.d||{};
    if(message.op===1){client.send(Buffer.from(encode({op:2,d:{negotiatedRpcVersion:1}})));return}
    if(message.op!==6)return;
    const response={op:7,d:{requestType:data.requestType,requestId:data.requestId,requestStatus:{result:true,code:100},responseData:{}}};
    if(data.requestType==='GetSceneList')response.d.responseData={currentProgramSceneName:'Starting Soon',scenes:[{sceneName:'Starting Soon'},{sceneName:'Gameplay'}]};
    if(data.requestType==='SetCurrentProgramScene')selected=data.requestData.sceneName;
    client.send(Buffer.from(encode(response)));
  });});
  const port=server.address().port,messages=[];const obs=new ObsService(message=>messages.push(message));
  await obs.connect(`ws://127.0.0.1:${port}`,'');
  const scenes=await obs.getScenes();assert.deepEqual(scenes.map(x=>x.sceneName),['Starting Soon','Gameplay']);
  await obs.setScene('Gameplay');assert.equal(selected,'Gameplay');assert.equal(obs.connected,true);await obs.disconnect();assert.equal(obs.connected,false);assert.ok(messages.some(x=>x.type==='obs_status'&&x.connected));
  await new Promise(resolve=>server.close(resolve));console.log('TikLiveTools OBS WebSocket integration test passed');
})().catch(error=>{console.error(error);process.exit(1)});
