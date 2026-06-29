@echo off
chcp 65001 >nul
title FlashCine

echo [FlashCine] Comprobando Ollama...

:: Si Ollama ya esta corriendo, no hace falta arrancarlo
curl -s --max-time 2 http://localhost:11434 >nul 2>&1
if %errorlevel% equ 0 (
    echo [FlashCine] Ollama ya esta en marcha.
    goto :start_app
)

:: Comprobar si ollama esta instalado
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Ollama no esta instalado o no esta en el PATH.
    echo         Descargalo en: https://ollama.com
    echo.
    pause
    exit /b 1
)

:: Arrancar ollama serve en ventana minimizada
echo [FlashCine] Arrancando Ollama...
start /MIN "Ollama" ollama serve

:: Esperar hasta 20s a que Ollama responda (10 intentos x 2s)
set /a tries=0
:wait_loop
timeout /t 2 /nobreak >nul
curl -s --max-time 2 http://localhost:11434 >nul 2>&1
if %errorlevel% equ 0 goto :ollama_ready
set /a tries+=1
if %tries% lss 10 goto :wait_loop
echo [FlashCine] Ollama tarda en responder, continuando de todos modos...
goto :start_app

:ollama_ready
echo [FlashCine] Ollama listo en http://localhost:11434

:start_app
echo [FlashCine] Arrancando la aplicacion...
cd flashcards-app
npm start
