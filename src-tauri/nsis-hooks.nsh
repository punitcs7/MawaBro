!include "x64.nsh"

; Modern UI 2 custom GUI initialization hooks.
; Executed immediately when the installer/uninstaller GUI initializes, BEFORE
; any pages or Section Install / CheckIfAppIsRunning execute.
; Forcefully terminates any running MawaBro instances using 64-bit System32 taskkill.
!define MUI_CUSTOMFUNCTION_GUIINIT MawaBroGUIInit
!define MUI_CUSTOMFUNCTION_UNGUIINIT un.MawaBroUnGUIInit

Function MawaBroGUIInit
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
    ${EnableX64FSRedirection}
  ${Else}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
  ${EndIf}
  Sleep 1500
FunctionEnd

Function un.MawaBroUnGUIInit
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
    ${EnableX64FSRedirection}
  ${Else}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
  ${EndIf}
  Sleep 1500
FunctionEnd

; Override CheckIfAppIsRunning to completely eliminate the Tauri RestartManager race condition (Tauri Issue #16277).
; Tauri's default CheckIfAppIsRunning calls RmShutdown which fails mid-update and executes `Abort $R3` ("Failed to kill MawaBro").
; By replacing it here, we guarantee forceful System32 taskkill and safe file-lock release WITHOUT aborting.
!ifmacrodef CheckIfAppIsRunning
  !macroundef CheckIfAppIsRunning
!endif

!macro CheckIfAppIsRunning executablePath productName
  DetailPrint "Ensuring ${productName} is closed..."
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
    ${EnableX64FSRedirection}
  ${Else}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
  ${EndIf}
  Sleep 1500
!macroend

!macro NSIS_HOOK_PREINSTALL
  ; Forcefully terminate any running MawaBro instances using 64-bit System32 taskkill
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
    ${EnableX64FSRedirection}
  ${Else}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
  ${EndIf}
  ; Allow Windows kernel to fully release file locks on the executable and WebView2 data
  Sleep 2500
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
    ${EnableX64FSRedirection}
  ${Else}
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "mawabro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro.exe" /T'
    Pop $0
    nsExec::Exec '"$SYSDIR\taskkill.exe" /F /IM "MawaBro-Portable.exe" /T'
    Pop $0
  ${EndIf}
  Sleep 2000
!macroend
