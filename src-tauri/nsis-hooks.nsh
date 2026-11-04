!include "x64.nsh"

!macro NSIS_HOOK_PREINSTALL
  ; Forcefully terminate any running MawaBro instances using 64-bit System32 taskkill
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
    nsExec::Exec 'taskkill.exe /F /IM "mawabro.exe" /T'
    nsExec::Exec 'taskkill.exe /F /IM "MawaBro.exe" /T'
    nsExec::Exec 'taskkill.exe /F /IM "MawaBro-Portable.exe" /T'
    ${EnableX64FSRedirection}
  ${Else}
    nsExec::Exec 'taskkill.exe /F /IM "mawabro.exe" /T'
    nsExec::Exec 'taskkill.exe /F /IM "MawaBro.exe" /T'
    nsExec::Exec 'taskkill.exe /F /IM "MawaBro-Portable.exe" /T'
  ${EndIf}
  ; Allow Windows to fully release file locks on the executable and WebView2 data
  Sleep 1200
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
    nsExec::Exec 'taskkill.exe /F /IM "mawabro.exe" /T'
    nsExec::Exec 'taskkill.exe /F /IM "MawaBro.exe" /T'
    nsExec::Exec 'taskkill.exe /F /IM "MawaBro-Portable.exe" /T'
    ${EnableX64FSRedirection}
  ${Else}
    nsExec::Exec 'taskkill.exe /F /IM "mawabro.exe" /T'
    nsExec::Exec 'taskkill.exe /F /IM "MawaBro.exe" /T'
    nsExec::Exec 'taskkill.exe /F /IM "MawaBro-Portable.exe" /T'
  ${EndIf}
  Sleep 1200
!macroend
