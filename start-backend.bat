@echo off
title ERP KRAM - Backend (Express :3001)
cd /d "C:\Users\Sistemas\Documents\GitHub\Mini-ERP-Kram\backend"

echo ========================================
echo   ERP KRAM - Backend Server
echo   Puerto: 3001
echo ========================================

REM Validar node_modules
if not exist "node_modules\" (
    echo.
    echo [ERROR] No se encontró node_modules.
    echo Ejecute: npm install
    echo.
    pause
    exit /b 1
)

REM Validar archivo .env
if not exist ".env" (
    echo.
    echo [ERROR] No se encontró archivo .env
    echo Copie .env.example a .env y configure las variables.
    echo.
    pause
    exit /b 1
)

echo   Iniciando...
echo.
C:\Users\Sistemas\nodejs\node-v20.18.0-win-x64\node.exe src\index.js
echo.
echo Servidor detenido.
pause