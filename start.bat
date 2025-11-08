@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%"
set "VENV_DIR=%PROJECT_ROOT%.venv"
set "PYTHON_VENV=%VENV_DIR%\Scripts\python.exe"
set "PIP_VENV=%VENV_DIR%\Scripts\pip.exe"
set "REQUIREMENTS=%PROJECT_ROOT%backend\requirements.txt"
set "MAIN_APP=%PROJECT_ROOT%backend\main.py"
set "SERVICE_NAME=MaibotWebUI"
set "PID_FILE=%PROJECT_ROOT%.maibot_webui.pid"

REM 颜色代码
set "COLOR_GREEN=[92m"
set "COLOR_RED=[91m"
set "COLOR_YELLOW=[93m"
set "COLOR_BLUE=[94m"
set "COLOR_CYAN=[96m"
set "COLOR_RESET=[0m"

title Maibot WebUI 管理器

:INIT
cls
echo.
echo %COLOR_CYAN%========================================%COLOR_RESET%
echo %COLOR_CYAN%       Maibot WebUI 管理器%COLOR_RESET%
echo %COLOR_CYAN%========================================%COLOR_RESET%
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo %COLOR_RED%[错误] 未找到 Python，请先安装 Python 3.8+%COLOR_RESET%
    pause
    exit /b 1
)

REM 检查虚拟环境
if not exist "%VENV_DIR%" (
    echo %COLOR_YELLOW%[提示] 虚拟环境不存在，正在创建...%COLOR_RESET%
    python -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo %COLOR_RED%[错误] 创建虚拟环境失败%COLOR_RESET%
        pause
        exit /b 1
    )
    echo %COLOR_GREEN%[成功] 虚拟环境创建完成%COLOR_RESET%
)

REM 检查依赖
echo %COLOR_BLUE%[检查] 正在检查依赖...%COLOR_RESET%
"%PYTHON_VENV%" -c "import fastapi, uvicorn, tomlkit" >nul 2>&1
if errorlevel 1 (
    echo %COLOR_YELLOW%[提示] 依赖不完整，正在安装...%COLOR_RESET%
    "%PIP_VENV%" install -r "%REQUIREMENTS%" -q
    if errorlevel 1 (
        echo %COLOR_RED%[错误] 依赖安装失败%COLOR_RESET%
        pause
        exit /b 1
    )
    echo %COLOR_GREEN%[成功] 依赖安装完成%COLOR_RESET%
) else (
    echo %COLOR_GREEN%[成功] 依赖检查通过%COLOR_RESET%
)

echo.
timeout /t 1 >nul
goto MENU

:MENU
cls
echo.
echo %COLOR_CYAN%========================================%COLOR_RESET%
echo %COLOR_CYAN%       Maibot WebUI 管理器%COLOR_RESET%
echo %COLOR_CYAN%========================================%COLOR_RESET%
echo.
echo  %COLOR_BLUE%[1]%COLOR_RESET% 启动服务
echo  %COLOR_BLUE%[2]%COLOR_RESET% 停止服务
echo  %COLOR_BLUE%[3]%COLOR_RESET% 重启服务
echo  %COLOR_BLUE%[4]%COLOR_RESET% 查看服务状态
echo.
echo  %COLOR_YELLOW%[5]%COLOR_RESET% 注册为系统服务 (需要管理员权限)
echo  %COLOR_YELLOW%[6]%COLOR_RESET% 注销系统服务 (需要管理员权限)
echo.
echo  %COLOR_RED%[0]%COLOR_RESET% 退出
echo.
echo %COLOR_CYAN%========================================%COLOR_RESET%
echo.

set /p choice="请选择操作 [0-6]: "

if "%choice%"=="1" goto START_SERVICE
if "%choice%"=="2" goto STOP_SERVICE
if "%choice%"=="3" goto RESTART_SERVICE
if "%choice%"=="4" goto STATUS_SERVICE
if "%choice%"=="5" goto REGISTER_SERVICE
if "%choice%"=="6" goto UNREGISTER_SERVICE
if "%choice%"=="0" goto EXIT
goto MENU

:START_SERVICE
cls
echo.
echo %COLOR_BLUE%[启动] 正在启动 Maibot WebUI 服务...%COLOR_RESET%
echo.

REM 检查是否已经在运行
if exist "%PID_FILE%" (
    set /p OLD_PID=<"%PID_FILE%"
    tasklist /FI "PID eq !OLD_PID!" 2>nul | find "!OLD_PID!" >nul
    if not errorlevel 1 (
        echo %COLOR_YELLOW%[警告] 服务已经在运行 (PID: !OLD_PID!)%COLOR_RESET%
        echo.
        pause
        goto MENU
    )
)

REM 启动服务
start "Maibot WebUI" /B "%PYTHON_VENV%" "%MAIN_APP%"

REM 等待服务启动并获取 PID
timeout /t 2 >nul

REM 查找进程 PID
for /f "tokens=2" %%a in ('tasklist /FI "WINDOWTITLE eq Maibot WebUI" /FO LIST ^| find "PID:"') do (
    set "SERVICE_PID=%%a"
)

if defined SERVICE_PID (
    echo !SERVICE_PID! > "%PID_FILE%"
    echo %COLOR_GREEN%[成功] 服务已启动 (PID: !SERVICE_PID!)%COLOR_RESET%
    echo %COLOR_GREEN%[访问] http://localhost:28517%COLOR_RESET%
) else (
    echo %COLOR_RED%[错误] 服务启动失败%COLOR_RESET%
)

echo.
pause
goto MENU

:STOP_SERVICE
cls
echo.
echo %COLOR_BLUE%[停止] 正在停止 Maibot WebUI 服务...%COLOR_RESET%
echo.

if not exist "%PID_FILE%" (
    echo %COLOR_YELLOW%[提示] 未找到运行中的服务%COLOR_RESET%
    echo.
    pause
    goto MENU
)

set /p SERVICE_PID=<"%PID_FILE%"
taskkill /PID %SERVICE_PID% /F >nul 2>&1
if errorlevel 1 (
    echo %COLOR_YELLOW%[提示] 进程可能已经停止%COLOR_RESET%
) else (
    echo %COLOR_GREEN%[成功] 服务已停止 (PID: %SERVICE_PID%)%COLOR_RESET%
)

del "%PID_FILE%" >nul 2>&1
echo.
pause
goto MENU

:RESTART_SERVICE
echo.
echo %COLOR_BLUE%[重启] 正在重启服务...%COLOR_RESET%
call :STOP_SERVICE_SILENT
timeout /t 1 >nul
call :START_SERVICE_SILENT
echo.
pause
goto MENU

:STOP_SERVICE_SILENT
if exist "%PID_FILE%" (
    set /p SERVICE_PID=<"%PID_FILE%"
    taskkill /PID !SERVICE_PID! /F >nul 2>&1
    del "%PID_FILE%" >nul 2>&1
)
goto :EOF

:START_SERVICE_SILENT
start "Maibot WebUI" /B "%PYTHON_VENV%" "%MAIN_APP%"
timeout /t 2 >nul
for /f "tokens=2" %%a in ('tasklist /FI "WINDOWTITLE eq Maibot WebUI" /FO LIST ^| find "PID:"') do (
    echo %%a > "%PID_FILE%"
)
goto :EOF

:STATUS_SERVICE
cls
echo.
echo %COLOR_BLUE%[状态] 服务状态检查%COLOR_RESET%
echo.

if not exist "%PID_FILE%" (
    echo %COLOR_YELLOW%状态: 未运行%COLOR_RESET%
) else (
    set /p SERVICE_PID=<"%PID_FILE%"
    tasklist /FI "PID eq !SERVICE_PID!" 2>nul | find "!SERVICE_PID!" >nul
    if errorlevel 1 (
        echo %COLOR_YELLOW%状态: 未运行 (PID 文件存在但进程不存在)%COLOR_RESET%
        del "%PID_FILE%" >nul 2>&1
    ) else (
        echo %COLOR_GREEN%状态: 运行中%COLOR_RESET%
        echo PID: !SERVICE_PID!
        echo %COLOR_GREEN%访问地址: http://localhost:28517%COLOR_RESET%
    )
)

echo.
pause
goto MENU

:REGISTER_SERVICE
cls
echo.
echo %COLOR_YELLOW%[系统服务] 注册为 Windows 系统服务%COLOR_RESET%
echo.
echo %COLOR_RED%注意: 此操作需要管理员权限！%COLOR_RESET%
echo.
echo 推荐使用 NSSM (Non-Sucking Service Manager) 来管理服务
echo 下载地址: https://nssm.cc/download
echo.
echo 手动注册步骤：
echo 1. 下载并解压 NSSM
echo 2. 以管理员身份运行 CMD
echo 3. 执行以下命令：
echo.
echo    nssm install %SERVICE_NAME% "%PYTHON_VENV%" "%MAIN_APP%"
echo    nssm set %SERVICE_NAME% DisplayName "Maibot WebUI"
echo    nssm set %SERVICE_NAME% Description "Maibot 配置管理 Web 界面"
echo    nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
echo    nssm start %SERVICE_NAME%
echo.
pause
goto MENU

:UNREGISTER_SERVICE
cls
echo.
echo %COLOR_YELLOW%[系统服务] 注销 Windows 系统服务%COLOR_RESET%
echo.
echo %COLOR_RED%注意: 此操作需要管理员权限！%COLOR_RESET%
echo.
echo 使用 NSSM 注销服务的步骤：
echo 1. 以管理员身份运行 CMD
echo 2. 执行以下命令：
echo.
echo    nssm stop %SERVICE_NAME%
echo    nssm remove %SERVICE_NAME% confirm
echo.
pause
goto MENU

:EXIT
cls
echo.
echo %COLOR_GREEN%感谢使用 Maibot WebUI 管理器！%COLOR_RESET%
echo.
timeout /t 1 >nul
exit /b 0