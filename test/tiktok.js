const assert=require('node:assert/strict');
const connectorPath=require.resolve('tiktok-live-connector');
class FakeConnection{
  constructor(){this.handlers={};}
  on(name,handler){this.handlers[name]=handler}
  async connect(){if(FakeConnection.fail)throw new Error('stream unavailable');return {roomId:'room-test'}}
  async getAvailableGifts(){return []}
  disconnect(){}
}
FakeConnection.fail=true;
require.cache[connectorPath]={id:connectorPath,filename:connectorPath,loaded:true,exports:{WebcastPushConnection:FakeConnection}};
const TikTokService=require('../src/tiktok');
(async()=>{
  const statuses=[];
  const service=new TikTokService(()=>{},status=>statuses.push(status),()=>{});
  await assert.rejects(()=>service.connect('example',''),/stream unavailable/);
  assert.equal(service.shouldReconnect,false,'a failed manual connection must not start a retry loop');
  assert.equal(service.reconnectTimer,null,'a failed manual connection must not leave a retry timer');
  FakeConnection.fail=false;
  await service.connect('example','');
  assert.equal(service.shouldReconnect,true,'a successful connection enables reconnect after disconnect');
  await service.disconnect();
  assert.equal(service.shouldReconnect,false,'manual disconnect must stop reconnects');
  assert.ok(statuses.some(s=>s.connected===false),'failed connection must publish an offline status');
  console.log('TikLiveTools TikTok reconnect test passed');
})().catch(error=>{console.error(error);process.exit(1)});
