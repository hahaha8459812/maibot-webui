@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 启用 Windows 10+ ANSI 颜色支持
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1

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

REM 设置窗口大小和颜色
mode con cols=80 lines=30
color 0B

title Maibot WebUI 管理器

:INIT
cls
echo.
echo ================================================================================
echo                            Maibot WebUI 管理器
echo ================================================================================
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

REM 检查虚拟环境
if not exist "%VENV_DIR%" (
    echo [提示] 虚拟环境不存在，正在创建...
    python -m venv "%VENV_DIR%"
    if errorlevel 1 (
        color 0C
        echo [错误] 创建虚拟环境失败
        pause
        exit /b 1
    )
    echo [成功] 虚拟环境创建完成
)

REM 检查依赖
echo [检查] 正在检查依赖...
"%PYTHON_VENV%" -c "import fastapi, uvicorn, tomlkit" >nul 2>&1
if errorlevel 1 (
    echo [提示] 依赖不完整，正在安装...
    "%PIP_VENV%" install -r "%REQUIREMENTS%" -q
    if errorlevel 1 (
        color 0C
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成
) else (
    echo [成功] 依赖检查通过
)

echo.
timeout /t 1 >nul
goto MENU

:MENU
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                              ║
echo ║                          Maibot WebUI 管理器 v2.0                           ║
echo ║                                                                              ║
echo ╠══════════════════════════════════════════════════════════════════════════════╣
echo ║                                                                              ║
echo ║    [1] 启动服务                    [2] 停止服务                              ║
echo ║                                                                              ║
echo ║    [3] 重启服务                    [4] 查看服务状态                          ║
echo ║                                                                              ║
echo ╠──────────────────────────────────────────────────────────────────────────────╣
echo ║                                                                              ║
echo ║    [5] 注册为系统服务 (需管理员)   [6] 注销系统服务 (需管理员)              ║
echo ║                                                                              ║
echo ╠──────────────────────────────────────────────────────────────────────────────╣
echo ║                                                                              ║
echo ║    [0] 退出程序                                                              ║
echo ║                                                                              ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
set /p choice="     请选择操作 [0-6]: "

if "%choice%"=="1" goto START_SERVICE
if "%choice%"=="2" goto STOP_SERVICE
if "%choice%"=="3" goto RESTART_SERVICE
if "%choice%"=="4" goto STATUS_SERVICE
if "%choice%"=="5" goto REGISTER_SERVICE
if "%choice%"=="6" goto UNREGISTER_SERVICE
if "%choice%"=="0" goto EXIT

echo.
echo     [错误] 无效的选择，请重试...
timeout /t 2 >nul
goto MENU

:START_SERVICE
cls
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo                               启动服务
echo ══════════════════════════════════════════════════════════════════════════════
echo.

REM 检查是否已经在运行
if exist "%PID_FILE%" (
    set /p OLD_PID=<"%PID_FILE%"
    tasklist /FI "PID eq !OLD_PID!" 2>nul | find "!OLD_PID!" >nul
    if not errorlevel 1 (
        echo [警告] 服务已经在运行 (PID: !OLD_PID!)
        echo.
        pause
        goto MENU
    )
)

REM 启动服务
echo [执行] 正在启动 Maibot WebUI 服务...
start "Maibot WebUI" /B "%PYTHON_VENV%" "%MAIN_APP%"

REM 等待服务启动并获取 PID
timeout /t 2 >nul

REM 查找进程 PID
for /f "tokens=2" %%a in ('tasklist /FI "WINDOWTITLE eq Maibot WebUI" /FO LIST ^| find "PID:"') do (
    set "SERVICE_PID=%%a"
)

if defined SERVICE_PID (
    echo !SERVICE_PID! > "%PID_FILE%"
    echo.
    echo [成功] 服务已启动
    echo.
    echo     进程 ID : !SERVICE_PID!
    echo     访问地址: http://localhost:28517
    echo     日志文件: %PROJECT_ROOT%maibot-webui.log
) else (
    echo.
    echo [错误] 服务启动失败，请检查日志文件
)

echo.
echo ══════════════════════════════════════════════════════════════════════════════
pause
goto MENU

:STOP_SERVICE
cls
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo                               停止服务
echo ══════════════════════════════════════════════════════════════════════════════
echo.

if not exist "%PID_FILE%" (
    echo [提示] 未找到运行中的服务
    echo.
    pause
    goto MENU
)

set /p SERVICE_PID=<"%PID_FILE%"
echo [执行] 正在停止服务 (PID: %SERVICE_PID%)...
taskkill /PID %SERVICE_PID% /F >nul 2>&1
if errorlevel 1 (
    echo.
    echo [提示] 进程可能已经停止
) else (
    echo.
    echo [成功] 服务已停止
)

del "%PID_FILE%" >nul 2>&1
echo.
echo ══════════════════════════════════════════════════════════════════════════════
pause
goto MENU

:RESTART_SERVICE
cls
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo                               重启服务
echo ══════════════════════════════════════════════════════════════════════════════
echo.
echo [执行] 正在重启服务...
call :STOP_SERVICE_SILENT
timeout /t 1 >nul
call :START_SERVICE_SILENT
echo.
echo ══════════════════════════════════════════════════════════════════════════════
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
    echo [成功] 服务已重启 (PID: %%a)
)
goto :EOF

:STATUS_SERVICE
cls
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo                             服务状态检查
echo ══════════════════════════════════════════════════════════════════════════════
echo.

if not exist "%PID_FILE%" (
    echo     状态: [未运行]
) else (
    set /p SERVICE_PID=<"%PID_FILE%"
    tasklist /FI "PID eq !SERVICE_PID!" 2>nul | find "!SERVICE_PID!" >nul
    if errorlevel 1 (
        echo     状态: [未运行] (PID 文件存在但进程不存在)
        del "%PID_FILE%" >nul 2>&1
    ) else (
        echo     状态: [运行中]
        echo     PID : !SERVICE_PID!
        echo     访问: http://localhost:28517
        echo     日志: %PROJECT_ROOT%maibot-webui.log
    )
)

echo.
echo ══════════════════════════════════════════════════════════════════════════════
pause
goto MENU

:REGISTER_SERVICE
cls
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo                          注册为 Windows 系统服务
echo ══════════════════════════════════════════════════════════════════════════════
echo.
echo  [提示] 此操作需要管理员权限！
echo.
echo  推荐使用 NSSM (Non-Sucking Service Manager) 来管理服务
echo  下载地址: https://nssm.cc/download
echo.
echo ──────────────────────────────────────────────────────────────────────────────
echo  手动注册步骤：
echo ──────────────────────────────────────────────────────────────────────────────
echo.
echo  1. 下载并解压 NSSM
echo  2. 以管理员身份运行 CMD
echo  3. 执行以下命令：
echo.
echo     nssm install %SERVICE_NAME% "%PYTHON_VENV%" "%MAIN_APP%"
echo     nssm set %SERVICE_NAME% DisplayName "Maibot WebUI"
echo     nssm set %SERVICE_NAME% Description "Maibot 配置管理 Web 界面"
echo     nssm set %SERVICE_NAME% Start SERVICE_AUTO_START
echo     nssm start %SERVICE_NAME%
echo.
echo ══════════════════════════════════════════════════════════════════════════════
pause
goto MENU

:UNREGISTER_SERVICE
cls
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo                          注销 Windows 系统服务
echo ══════════════════════════════════════════════════════════════════════════════
echo.
echo  [提示] 此操作需要管理员权限！
echo.
echo ──────────────────────────────────────────────────────────────────────────────
echo  使用 NSSM 注销服务的步骤：
echo ──────────────────────────────────────────────────────────────────────────────
echo.
echo  1. 以管理员身份运行 CMD
echo  2. 执行以下命令：
echo.
echo     nssm stop %SERVICE_NAME%
echo     nssm remove %SERVICE_NAME% confirm
echo.
echo ══════════════════════════════════════════════════════════════════════════════
pause
goto MENU

:EXIT
cls
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo.
echo                      感谢使用 Maibot WebUI 管理器！
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo.
timeout /t 2 >nul
exit /b 0