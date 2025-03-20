@echo off
echo Starting EvaluRead application...

REM Stop any running Python processes (for Windows)
taskkill /F /IM python.exe /T 2>nul

REM Start the backend server
start cmd /k "cd server && python app.py"

REM Wait for the backend to initialize
timeout /t 3

REM Start the frontend
start cmd /k "npm run dev"

echo EvaluRead is now running!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
