#!/usr/bin/env bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 路径定义
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
VENV_DIR="$PROJECT_ROOT/.venv"
PYTHON_VENV="$VENV_DIR/bin/python"
PIP_VENV="$VENV_DIR/bin/pip"
REQUIREMENTS="$PROJECT_ROOT/backend/requirements.txt"
MAIN_APP="$PROJECT_ROOT/backend/main.py"
LOG_FILE="$PROJECT_ROOT/maibot-webui.log"
PID_FILE="$PROJECT_ROOT/.maibot_webui.pid"
SCREEN_SESSION="maibot-webui-session"

SERVICE_NAME="maibot-webui"
SYSTEMD_SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

print_separator() {
    echo -e "${CYAN}========================================${NC}"
}

pause() {
    read -rp "按回车键继续..."
}

ensure_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}[错误] 未找到 Python3，请先安装 Python 3.8+${NC}"
        exit 1
    fi
    echo -e "${BLUE}[检查] Python 版本: $(python3 --version)${NC}"
}

ensure_virtualenv() {
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}[提示] 正在创建虚拟环境...${NC}"
        python3 -m venv "$VENV_DIR"
        echo -e "${GREEN}[成功] 虚拟环境已创建${NC}"
    fi
}

ensure_dependencies() {
    echo -e "${BLUE}[检查] 正在检查依赖...${NC}"
    if ! "$PYTHON_VENV" -c "import fastapi, uvicorn, tomlkit" >/dev/null 2>&1; then
        echo -e "${YELLOW}[提示] 依赖不完整，正在安装...${NC}"
        "$PIP_VENV" install -r "$REQUIREMENTS" -q
        echo -e "${GREEN}[成功] 依赖安装完成${NC}"
    else
        echo -e "${GREEN}[成功] 依赖检查通过${NC}"
    fi
}

init_environment() {
    clear
    print_separator
    echo -e "${CYAN}       Maibot WebUI 管理器${NC}"
    print_separator
    echo
    ensure_python
    ensure_virtualenv
    ensure_dependencies
    echo
}

screen_installed() {
    if ! command -v screen >/dev/null 2>&1; then
        echo -e "${RED}[错误] 未安装 screen，请通过 sudo apt install screen 安装后重试${NC}"
        pause
        return 1
    fi
    return 0
}

session_exists() {
    screen -ls | grep -q "\.${SCREEN_SESSION}" 2>/dev/null
}

start_service() {
    clear
    print_separator
    echo -e "${BLUE}[启动] 正在启动 Maibot WebUI 服务...${NC}"
    print_separator
    echo

    screen_installed || return

    if session_exists; then
        echo -e "${YELLOW}[提示] screen 会话 ${SCREEN_SESSION} 已存在，服务可能已经在运行${NC}"
        pause
        return
    fi

    ensure_virtualenv
    ensure_dependencies

    touch "$LOG_FILE"
    screen -dmS "$SCREEN_SESSION" bash -c "
        cd '$PROJECT_ROOT'
        exec '$PYTHON_VENV' '$MAIN_APP' >> '$LOG_FILE' 2>&1
    "

    echo "$SCREEN_SESSION" > "$PID_FILE"

    sleep 2
    if session_exists; then
        echo -e "${GREEN}[成功] 服务已启动，screen 会话: ${SCREEN_SESSION}${NC}"
        echo -e "${GREEN}[访问] http://localhost:28517${NC}"
        echo -e "${BLUE}[日志] $LOG_FILE${NC}"
    else
        echo -e "${RED}[错误] 服务启动失败，请检查日志${NC}"
        rm -f "$PID_FILE"
    fi
    echo
    pause
}

stop_service() {
    local silent="${1:-}"
    clear
    print_separator
    echo -e "${BLUE}[停止] 正在停止 Maibot WebUI 服务...${NC}"
    print_separator
    echo

    if ! session_exists; then
        echo -e "${YELLOW}[提示] 服务未运行${NC}"
        pause
        return
    fi

    screen -S "$SCREEN_SESSION" -X quit || true
    rm -f "$PID_FILE"
    echo -e "${GREEN}[成功] 已停止 screen 会话 ${SCREEN_SESSION}${NC}"
    echo
    if [ -z "$silent" ]; then
        pause
    fi
}

restart_service() {
    stop_service "silent"
    start_service
}

check_status() {
    clear
    print_separator
    echo -e "${BLUE}[状态] 当前服务状态${NC}"
    print_separator
    echo

    if session_exists; then
        echo -e "${GREEN}[运行中] screen 会话: ${SCREEN_SESSION}${NC}"
        screen -ls | grep "\.${SCREEN_SESSION}" || true
    else
        echo -e "${YELLOW}[停止] 未发现运行中的 screen 会话${NC}"
    fi
    echo
    pause
}

register_systemd_service() {
    clear
    print_separator
    echo -e "${YELLOW}[系统服务] 注册 systemd 服务${NC}"
    print_separator
    echo

    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}[错误] 需要 root 权限，请通过 sudo 运行此脚本${NC}"
        pause
        return
    fi

    cat > "$SYSTEMD_SERVICE_FILE" <<EOF
[Unit]
Description=Maibot WebUI Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_ROOT
ExecStart=$PYTHON_VENV $MAIN_APP
Restart=on-failure
RestartSec=5
StandardOutput=append:$LOG_FILE
StandardError=append:$LOG_FILE

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"

    echo -e "${GREEN}[成功] systemd 服务已注册为 $SERVICE_NAME${NC}"
    echo "可通过以下命令管理："
    echo "  sudo systemctl start $SERVICE_NAME"
    echo "  sudo systemctl stop $SERVICE_NAME"
    echo "  sudo systemctl status $SERVICE_NAME"
    echo
    pause
}

unregister_systemd_service() {
    clear
    print_separator
    echo -e "${YELLOW}[系统服务] 注销 systemd 服务${NC}"
    print_separator
    echo

    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}[错误] 需要 root 权限，请通过 sudo 运行此脚本${NC}"
        pause
        return
    fi

    if [ ! -f "$SYSTEMD_SERVICE_FILE" ]; then
        echo -e "${YELLOW}[提示] 未找到已注册的 systemd 服务${NC}"
        pause
        return
    fi

    systemctl disable "$SERVICE_NAME" || true
    systemctl stop "$SERVICE_NAME" || true
    rm -f "$SYSTEMD_SERVICE_FILE"
    systemctl daemon-reload

    echo -e "${GREEN}[成功] 已注销 systemd 服务${NC}"
    echo
    pause
}

check_systemd_status() {
    clear
    print_separator
    echo -e "${BLUE}[系统服务] systemd 状态${NC}"
    print_separator
    echo

    if [ ! -f "$SYSTEMD_SERVICE_FILE" ]; then
        echo -e "${YELLOW}[提示] 未注册 systemd 服务${NC}"
    else
        systemctl status "$SERVICE_NAME" --no-pager || true
    fi
    echo
    pause
}

show_menu() {
    clear
    print_separator
    echo -e "${CYAN}       Maibot WebUI 管理器${NC}"
    print_separator
    echo
    echo -e " ${BLUE}[1]${NC} 启动服务"
    echo -e " ${BLUE}[2]${NC} 停止服务"
    echo -e " ${BLUE}[3]${NC} 重启服务"
    echo -e " ${BLUE}[4]${NC} 查看服务状态"
    echo
    echo -e " ${YELLOW}[5]${NC} 注册为系统服务 (需 root)"
    echo -e " ${YELLOW}[6]${NC} 注销系统服务 (需 root)"
    echo -e " ${YELLOW}[7]${NC} 查看系统服务状态"
    echo
    echo -e " ${RED}[0]${NC} 退出"
    echo
}

main() {
    init_environment

    while true; do
        show_menu
        read -rp "请选择操作 [0-7]: " choice
        case "$choice" in
            1) start_service ;;
            2) stop_service ;;
            3) restart_service ;;
            4) check_status ;;
            5) register_systemd_service ;;
            6) unregister_systemd_service ;;
            7) check_systemd_status ;;
            0)
                clear
                echo -e "${GREEN}感谢使用 Maibot WebUI 管理器！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选择，请重试${NC}"
                sleep 1
                ;;
        esac
    done
}

main
