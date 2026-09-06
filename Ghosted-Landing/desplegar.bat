@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================================
echo    Desplegando Ghosted a PRODUCCION (Vercel)
echo ==============================================
echo.
call vercel --prod
if errorlevel 1 (
  echo.
  echo No se encontro "vercel" en el PATH. Probando con npx...
  call npx --yes vercel --prod
)
echo.
echo ----------------------------------------------
echo  Si pidio iniciar sesion, se abrio el navegador:
echo  inicia sesion y vuelve a ejecutar este archivo.
echo ----------------------------------------------
pause
