@echo off
echo Starting backend server...
start "Backend" cmd /k "cd backend && python main.py"

echo Starting frontend server...
start "Frontend" cmd /k "cd frontend && pnpm dev"

echo Both servers are starting in new windows.