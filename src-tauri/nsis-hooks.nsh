!include "x64.nsh"

; Modern UI 2 custom GUI initialization hooks.
; Executed immediately when the installer/uninstaller GUI initializes, BEFORE
; any pages or Section Install / CheckIfAppIsRunning execute.
; Forcefully terminates any running MawaBro instances using 64-bit System32 taskkill
; so that Windows Restart Manager finds 0 processes and never aborts with "Failed to kill".
!define MUI_CUSTOMFUNCTION_GUIINIT MawaBroGUIInit
!define MUI_CUSTOMFUNCTION_UNGUIINIT un.MawaBroUnGUIInit

Function MawaBroGUIInit
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
  Sleep 1500
FunctionEnd

Function un.MawaBroUnGUIInit
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
  Sleep 1500
FunctionEnd

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
  Sleep 2500
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
  Sleep 2500
!macroend
