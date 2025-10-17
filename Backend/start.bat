@echo off
echo Starting backend servers...

echo Installing Express server dependencies...
cd /d "%~dp0"
npm install

echo Starting Express server on port 3001...
start "Express Server" cmd /c "node server.js"

echo Switching to encryption directory...
cd encryption

echo Installing Python encryption dependencies...
pip install -r requirements.txt

echo Starting Python encryption server on port 5001...
start "Encryption Server" cmd /c "python app.py"

echo Both servers should now be running:
echo - Express API Server: http://localhost:3001
echo - Python Encryption Server: http://localhost:5001
echo.
echo Press any key to stop all servers...
pause > nul

echo Stopping servers...
taskkill /FI "WINDOWTITLE eq Express Server*" /T >nul 2>nul
taskkill /FI "WINDOWTITLE eq Encryption Server*" /T >nul 2>nul

echo Servers stopped.
pause
