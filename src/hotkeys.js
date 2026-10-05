const path=require('path');
const {spawn}=require('child_process');
class HotkeyService{
  constructor(onTrigger){this.onTrigger=onTrigger;this.proc=null;this.bindings={1:'timer_toggle',2:'wheel_spin',3:'song_next',4:'obs_scene_next'}}
  start(bindings={}){if(this.proc)return;this.bindings={...this.bindings,...bindings};const script=path.join(__dirname,'hotkeys.ps1');this.proc=spawn('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',script],{stdio:['ignore','pipe','ignore']});let buf='';this.proc.stdout.on('data',chunk=>{buf+=chunk.toString();const lines=buf.split(/\r?\n/);buf=lines.pop();for(const line of lines){const id=Number(line.trim());if(id&&this.bindings[id])Promise.resolve(this.onTrigger(this.bindings[id],id)).catch(()=>{})}});this.proc.on('close',()=>{this.proc=null})}
  stop(){if(this.proc){this.proc.kill();this.proc=null}}
}
module.exports=HotkeyService;
