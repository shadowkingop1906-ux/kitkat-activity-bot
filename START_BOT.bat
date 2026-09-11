@echo off
title KITKAT Activity Bot
cd /d "%~dp0"
echo ===================================================
echo   Starting KITKAT Activity Bot (Clean Architecture)
echo ===================================================
"%LOCALAPPDATA%\Programs\Node\node.exe" src/index.js
pause
