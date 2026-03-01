@echo off
echo Starting YouTube Trimmer...
start cmd /k "cd backend && npm start"
start cmd /k "cd frontend && npm run dev"
echo Servers are starting. Open http://localhost:3000 in your browser.
pause
