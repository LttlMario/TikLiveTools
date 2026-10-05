Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class TikLiveHotkeys {
  [DllImport("user32.dll")] public static extern bool RegisterHotKey(IntPtr hWnd,int id,uint fsModifiers,uint vk);
  [DllImport("user32.dll")] public static extern bool UnregisterHotKey(IntPtr hWnd,int id);
  [DllImport("user32.dll")] public static extern int GetMessage(out MSG lpMsg,IntPtr hWnd,uint min,uint max);
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int x; public int y; }
  [StructLayout(LayoutKind.Sequential)] public struct MSG { public IntPtr hWnd; public uint message; public IntPtr wParam; public IntPtr lParam; public uint time; public POINT pt; }
}
"@
$MOD_CONTROL=2; $MOD_ALT=1; $VK_F1=0x70
for($id=1;$id -le 4;$id++){[TikLiveHotkeys]::RegisterHotKey([IntPtr]::Zero,$id,$MOD_CONTROL -bor $MOD_ALT,$VK_F1+$id-1)|Out-Null}
try { while($true){$msg=New-Object TikLiveHotkeys+MSG; if([TikLiveHotkeys]::GetMessage([ref]$msg,[IntPtr]::Zero,0,0)-le 0){break}; if($msg.message -eq 0x0312){[Console]::WriteLine($msg.wParam.ToInt32());[Console]::Out.Flush()}}}
finally {for($id=1;$id -le 4;$id++){[TikLiveHotkeys]::UnregisterHotKey([IntPtr]::Zero,$id)|Out-Null}}
