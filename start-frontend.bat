@echo off
title ERP KRAM - Frontend (Next.js :3000)
cd /d "C:\Users\Sistemas\Documents\GitHub\Mini-ERP-Kram\frontend"
echo ========================================
echo   ERP KRAM - Frontend Server
echo   Puerto: 3000
echo   Iniciando...
echo ========================================
echo.
C:\Users\Sistemas\nodejs\node-v20.18.0-win-x64\node_modules\.bin\next.cmd dev -p 3000
echo.
echo Servidor detenido.
pause
