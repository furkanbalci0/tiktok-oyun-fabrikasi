@echo off
chcp 65001 >nul
title Canli Oyun - Kopru
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kur, sonra yeniden dene.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\tiktok-live-connector" (
  echo.
  echo  Gereken kutuphane indiriliyor, bir kez yapilir...
  call npm install --omit=dev
  if errorlevel 1 (
    echo.
    echo  Kutuphane indirilemedi. Internet baglantini kontrol edip yeniden dene.
    echo.
    pause
    exit /b 1
  )
)

echo.
set /p KULLANICI= TikTok kullanici adin (basinda @ olmadan):
if "%KULLANICI%"=="" (
  echo  Kullanici adi bos birakilamaz.
  pause
  exit /b 1
)

node kopru.js "%KULLANICI%" --ac
echo.
pause
