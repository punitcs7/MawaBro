!macro NSIS_HOOK_PREINSTALL
  ; Forcefully terminate any running MawaBro instances so files can be updated smoothly
  nsExec::Exec 'taskkill.exe /F /IM mawabro.exe /T'
  nsExec::Exec 'taskkill.exe /F /IM MawaBro.exe /T'
  nsExec::Exec 'taskkill.exe /F /IM MawaBro-Portable.exe /T'
  Sleep 500
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  nsExec::Exec 'taskkill.exe /F /IM mawabro.exe /T'
  nsExec::Exec 'taskkill.exe /F /IM MawaBro.exe /T'
  nsExec::Exec 'taskkill.exe /F /IM MawaBro-Portable.exe /T'
  Sleep 500
!macroend
