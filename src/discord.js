class DiscordNotifier{
  constructor(getSettings){this.getSettings=getSettings}
  async send(content){const settings=await this.getSettings();const url=settings.discordWebhookUrl;if(!url)return false;try{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content,username:'TikLiveTools'})});return r.ok}catch{return false}}
  async event(event){if(event.type==='gift')return this.send(`🎁 **${event.displayName||event.uniqueId}** a trimis ${event.giftName||'un gift'} (${event.coins||0} coins).`);if(event.type==='follow')return this.send(`✨ **${event.displayName||event.uniqueId}** te urmărește acum.`);return false}
}
module.exports=DiscordNotifier;
