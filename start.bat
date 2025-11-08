@echo off
REM 获取批处理文件所在的目录
set SCRIPT_DIR=%~dp0

REM 使用 python 执行启动器脚本
echo "正在启动 Maibot WebUI..."
python "%SCRIPT_DIR%\run.py"

pause