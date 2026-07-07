@echo off
echo Stopping servers...
taskkill /FI "WINDOWTITLE eq Backend - FastAPI*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - Vite*" /F >nul 2>&1
echo Done.
