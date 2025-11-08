@echo off
echo Killing existing server processes...

echo Finding and killing processes on port 28517 (backend)...
FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr ":28517"') DO taskkill /F /PID %%P

echo Finding and killing processes on port 5173 (frontend)...
FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr ":5173"') DO taskkill /F /PID %%P

echo Killing any remaining Node.js processes...
taskkill /F /IM node.exe /T > nul 2>&1

echo All processes killed. Restarting servers...
timeout /t 2 > nul

start "Backend" cmd /k "cd backend && python main.py"
start "Frontend" cmd /k "cd frontend && pnpm dev"

echo Both servers are restarting in new windows.