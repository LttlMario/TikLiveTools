const {TikTokLiveConnection,WebcastEvent,ControlEvent}=require('tiktok-live-connector');

function userFields(data){
  const user=data.user||{};
  return {uniqueId:user.uniqueId||data.uniqueId,displayName:user.nickname||data.nickname,avatarUrl:user.profilePictureUrl||data.profilePictureUrl,isModerator:Boolean(user.isModerator||data.isModerator),isSubscriber:Boolean(user.isSubscriber||data.isSubscriber)};
}
function normalizeGift(data){
  const u=userFields(data),details=data.giftDetails||{};
  return {...u,giftName:data.giftName||details.giftName||data.extendedGiftInfo?.name,giftId:data.giftId||details.giftId,coins:Number(data.diamondCount??data.coinCount??data.extendedGiftInfo?.diamondCount??data.extendedGiftInfo?.cost??0),quantity:Number(data.repeatCount||1),giftType:Number(details.giftType??data.giftType??0),repeatEnd:Boolean(data.repeatEnd)};
}
function normalizeLike(data){const u=userFields(data);return {...u,quantity:Number(data.likeCount||1),totalLikeCount:Number(data.totalLikeCount||0)}}

class TikTokService{
  constructor(onEvent,onStatus,onCatalog){this.onEvent=onEvent;this.onStatus=onStatus;this.onCatalog=onCatalog;this.connection=null}
  async connect(username){
    if(!username)throw new Error('Introdu username-ul TikTok.');
    await this.disconnect();
    const opts={enableExtendedGiftInfo:true,processInitialData:true,fetchRoomInfoOnConnect:true};
    if(process.env.TIKTOK_SIGN_API_KEY)opts.signApiKey=process.env.TIKTOK_SIGN_API_KEY;
    this.connection=new TikTokLiveConnection(username.replace(/^@/,''),opts);
    const emit=(type,d={})=>this.onEvent({type,...d,payload:d});
    this.connection.on(ControlEvent.CONNECTED,s=>this.onStatus({connected:true,roomId:s.roomId,username}));
    this.connection.on(ControlEvent.DISCONNECTED,i=>this.onStatus({connected:false,reason:i?.reason||'Disconnected'}));
    this.connection.on(ControlEvent.ERROR,e=>this.onStatus({connected:false,error:String(e?.exception||e)}));
    this.connection.on(WebcastEvent.CHAT,d=>emit('chat',{...userFields(d),comment:d.comment||''}));
    this.connection.on(WebcastEvent.FOLLOW,d=>emit('follow',userFields(d)));
    this.connection.on(WebcastEvent.SHARE,d=>emit('share',userFields(d)));
    this.connection.on(WebcastEvent.LIKE,d=>emit('like',normalizeLike(d)));
    this.connection.on(WebcastEvent.GIFT,d=>{const gift=normalizeGift(d);if(gift.giftType===1&&!gift.repeatEnd)return;delete gift.giftType;delete gift.repeatEnd;emit('gift',gift)});
    this.connection.on(WebcastEvent.MEMBER,d=>emit('join',{...userFields(d),memberCount:Number(d.memberCount||0)}));
    this.connection.on(WebcastEvent.SUB_NOTIFY,d=>emit('subscribe',userFields(d)));
    this.connection.on(WebcastEvent.QUESTION_NEW,d=>emit('question',{...userFields(d),comment:d.question||d.content||''}));
    this.connection.on(WebcastEvent.LINK_MIC_BATTLE,d=>emit('battle',{payload:d}));
    if(WebcastEvent.ROOM_USER)this.connection.on(WebcastEvent.ROOM_USER,d=>this.onStatus({roomStats:{viewerCount:Number(d.viewerCount||0),topGifters:(d.ranksList||[]).slice(0,10).map(x=>({uniqueId:x.user?.uniqueId,displayName:x.user?.nickname,coins:Number(x.coinCount||0)}))}}));
    await this.connection.connect();
    try{const gifts=await this.connection.fetchAvailableGifts();this.onCatalog(gifts)}catch{this.onCatalog([])}
  }
  async disconnect(){if(this.connection){try{await this.connection.disconnect()}catch{}this.connection=null;this.onCatalog([])}}
}
module.exports=TikTokService;
module.exports.normalizeGift=normalizeGift;
module.exports.normalizeLike=normalizeLike;
