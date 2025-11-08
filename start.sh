#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
VENV_DIR="$PROJECT_ROOT/.venv"
PYTHON_VENV="$VENV_DIR/bin/python"
PIP_VENV="$VENV_DIR/bin/pip"
REQUIREMENTS="$PROJECT_ROOT/backend/requirements.txt"
MAIN_APP="$PROJECT_ROOT/backend/main.py"
SERVICE_NAME="maibot-webui"
PID_FILE="$PROJECT_ROOT/.maibot_webui.pid"
SYSTEMD_SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

# 初始化函数
init_environment() {
    clear
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}       Maibot WebUI 管理器${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}[错误] 未找到 Python 3，请先安装 Python 3.8+${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}[检查] Python 版本: $(python3 --version)${NC}"
    
    # 检查虚拟环境
    if [ ! -d "$VENV_DIR" ]; then
        echo -e "${YELLOW}[提示] 虚拟环境不存在，正在创建...${NC}"
        python3 -m venv "$VENV_DIR"
        if [ $? -ne 0 ]; then
            echo -e "${RED}[错误] 创建虚拟环境失败${NC}"
            exit 1
        fi
        echo -e "${GREEN}[成功] 虚拟环境创建完成${NC}"
    fi
    
    # 检查依赖
    echo -e "${BLUE}[检查] 正在检查依赖...${NC}"
    "$PYTHON_VENV" -c "import fastapi, uvicorn, tomlkit" &> /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}[提示] 依赖不完整，正在安装...${NC}"
        "$PIP_VENV" install -r "$REQUIREMENTS" -q
        if [ $? -ne 0 ]; then
            echo -e "${RED}[错误] 依赖安装失败${NC}"
            exit 1
        fi
        echo -e "${GREEN}[成功] 依赖安装完成${NC}"
    else
        echo -e "${GREEN}[成功] 依赖检查通过${NC}"
    fi
    
    echo ""
    sleep 1
}

# 显示菜单
show_menu() {
    clear
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}       Maibot WebUI 管理器${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo -e " ${BLUE}[1]${NC} 启动服务"
    echo -e " ${BLUE}[2]${NC} 停止服务"
    echo -e " ${BLUE}[3]${NC} 重启服务"
    echo -e " ${BLUE}[4]${NC} 查看服务状态"
    echo ""
    echo -e " ${YELLOW}[5]${NC} 注册为系统服务 (需要 root 权限)"
    echo -e " ${YELLOW}[6]${NC} 注销系统服务 (需要 root 权限)"
    echo -e " ${YELLOW}[7]${NC} 查看系统服务状态"
    echo ""
    echo -e " ${RED}[0]${NC} 退出"
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# 启动服务
start_service() {
    echo ""
    echo -e "${BLUE}[启动] 正在启动 Maibot WebUI 服务...${NC}"
    echo ""
    
    # 检查是否已经在运行
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p $OLD_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}[警告] 服务已经在运行 (PID: $OLD_PID)${NC}"
            echo ""
            read -p "按回车键继续..."
            return
        fi
    fi
    
    # 启动服务
    nohup "$PYTHON_VENV" "$MAIN_APP" > "$PROJECT_ROOT/maibot-webui.log" 2>&1 &
    SERVICE_PID=$!
    
    # 保存 PID
    echo $SERVICE_PID > "$PID_FILE"
    
    # 等待服务启动
    sleep 2
    
    # 验证服务是否启动成功
    if ps -p $SERVICE_PID > /dev/null 2>&1; then
        echo -e "${GREEN}[成功] 服务已启动 (PID: $SERVICE_PID)${NC}"
        echo -e "${GREEN}[访问] http://localhost:28517${NC}"
        echo -e "${BLUE}[日志] $PROJECT_ROOT/maibot-webui.log${NC}"
    else
        echo -e "${RED}[错误] 服务启动失败，请查看日志文件${NC}"
        rm -f "$PID_FILE"
    fi
    
    echo ""
    read -p "按回车键继续..."
}

# 停止服务
stop_service() {
    echo ""
    echo -e "${BLUE}[停止] 正在停止 Maibot WebUI 服务...${NC}"
    echo ""
    
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${YELLOW}[提示] 未找到运行中的服务${NC}"
        echo ""
        read -p "按回车键继续..."
        return
    fi
    
    SERVICE_PID=$(cat "$PID_FILE")
    
    if ps -p $SERVICE_PID > /dev/null 2>&1; then
        kill $SERVICE_PID
        sleep 1
        
        # 如果进程还在运行，强制杀死
        if ps -p $SERVICE_PID > /dev/null 2>&1; then
            kill -9 $SERVICE_PID
        fi
        
        echo -e "${GREEN}[成功] 服务已停止 (PID: $SERVICE_PID)${NC}"
    else
        echo -e "${YELLOW}[提示] 进程可能已经停止${NC}"
    fi
    
    rm -f "$PID_FILE"
    echo ""
    read -p "按回车键继续..."
}

# 重启服务
restart_service() {
    echo ""
    echo -e "${BLUE}[重启] 正在重启服务...${NC}"
    stop_service_silent
    sleep 1
    start_service_silent
    echo ""
    read -p "按回车键继续..."
}

# 静默停止服务
stop_service_silent() {
    if [ -f "$PID_FILE" ]; then
        SERVICE_PID=$(cat "$PID_FILE")
        if ps -p $SERVICE_PID > /dev/null 2>&1; then
            kill $SERVICE_PID 2>/dev/null
            sleep 1
            if ps -p $SERVICE_PID > /dev/null 2>&1; then
                kill -9 $SERVICE_PID 2>/dev/null
            fi
        fi
        rm -f "$PID_FILE"
    fi
}

# 静默启动服务
start_service_silent() {
    nohup "$PYTHON_VENV" "$MAIN_APP" > "$PROJECT_ROOT/maibot-webui.log" 2>&1 &
    SERVICE_PID=$!
    echo $SERVICE_PID > "$PID_FILE"
    sleep 2
    if ps -p $SERVICE_PID > /dev/null 2>&1; then
        echo -e "${GREEN}[成功] 服务已重启 (PID: $SERVICE_PID)${NC}"
    else
        echo -e "${RED}[错误] 服务重启失败${NC}"
    fi
}

# 查看服务状态
check_status() {
    echo ""
    echo -e "${BLUE}[状态] 服务状态检查${NC}"
    echo ""
    
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${YELLOW}状态: 未运行${NC}"
    else
        SERVICE_PID=$(cat "$PID_FILE")
        if ps -p $SERVICE_PID > /dev/null 2>&1; then
            echo -e "${GREEN}状态: 运行中${NC}"
            echo "PID: $SERVICE_PID"
            echo -e "${GREEN}访问地址: http://localhost:28517${NC}"
            echo -e "${BLUE}日志文件: $PROJECT_ROOT/maibot-webui.log${NC}"
        else
            echo -e "${YELLOW}状态: 未运行 (PID 文件存在但进程不存在)${NC}"
            rm -f "$PID_FILE"
        fi
    fi
    
    echo ""
    read -p "按回车键继续..."
}

# 注册系统服务
register_systemd_service() {
    echo ""
    echo -e "${YELLOW}[系统服务] 注册为 systemd 系统服务${NC}"
    echo ""
    
    # 检查是否有 root 权限
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}[错误] 此操作需要 root 权限，请使用 sudo 运行此脚本${NC}"
        echo ""
        read -p "按回车键继续..."
        return
    fi
    
    # 创建 systemd 服务文件
    cat > "$SYSTEMD_SERVICE_FILE" << EOF
[Unit]
Description=Maibot WebUI Service
After=network.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=$PYTHON_VENV $MAIN_APP
Restart=on-failure
RestartSec=5
StandardOutput=append:$PROJECT_ROOT/maibot-webui.log
StandardError=append:$PROJECT_ROOT/maibot-webui.log

[Install]
WantedBy=multi-user.target
EOF
    
    # 重新加载 systemd
    systemctl daemon-reload
    
    # 启用服务
    systemctl enable $SERVICE_NAME
    
    echo -e "${GREEN}[成功] 系统服务已注册${NC}"
    echo ""
    echo "可用命令："
    echo "  sudo systemctl start $SERVICE_NAME    # 启动服务"
    echo "  sudo systemctl stop $SERVICE_NAME     # 停止服务"
    echo "  sudo systemctl restart $SERVICE_NAME  # 重启服务"
    echo "  sudo systemctl status $SERVICE_NAME   # 查看状态"
    echo ""
    read -p "是否现在启动服务? [y/N]: " choice
    if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
        systemctl start $SERVICE_NAME
        echo -e "${GREEN}[成功] 服务已启动${NC}"
    fi
    
    echo ""
    read -p "按回车键继续..."
}

# 注销系统服务
unregister_systemd_service() {
    echo ""
    echo -e "${YELLOW}[系统服务] 注销 systemd 系统服务${NC}"
    echo ""
    
    # 检查是否有 root 权限
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}[错误] 此操作需要 root 权限，请使用 sudo 运行此脚本${NC}"
        echo ""
        read -p "按回车键继续..."
        return
    fi
    
    # 检查服务是否存在
    if [ ! -f "$SYSTEMD_SERVICE_FILE" ]; then
        echo -e "${YELLOW}[提示] 系统服务未注册${NC}"
        echo ""
        read -p "按回车键继续..."
        return
    fi
    
    # 停止并禁用服务
    systemctl stop $SERVICE_NAME 2>/dev/null
    systemctl disable $SERVICE_NAME 2>/dev/null
    
    # 删除服务文件
    rm -f "$SYSTEMD_SERVICE_FILE"
    
    # 重新加载 systemd
    systemctl daemon-reload
    
    echo -e "${GREEN}[成功] 系统服务已注销${NC}"
    echo ""
    read -p "按回车键继续..."
}

# 查看系统服务状态
check_systemd_status() {
    echo ""
    echo -e "${BLUE}[系统服务] systemd 服务状态${NC}"
    echo ""
    
    if [ ! -f "$SYSTEMD_SERVICE_FILE" ]; then
        echo -e "${YELLOW}系统服务未注册${NC}"
    else
        systemctl status $SERVICE_NAME --no-pager
    fi
    
    echo ""
    read -p "按回车键继续..."
}

# 主循环
main() {
    init_environment
    
    while true; do
        show_menu
        read -p "请选择操作 [0-7]: " choice
        
        case $choice in
            1) start_service ;;
            2) stop_service ;;
            3) restart_service ;;
            4) check_status ;;
            5) register_systemd_service ;;
            6) unregister_systemd_service ;;
            7) check_systemd_status ;;
            0) 
                clear
                echo ""
                echo -e "${GREEN}感谢使用 Maibot WebUI 管理器！${NC}"
                echo ""
                exit 0
                ;;
            *)
                echo -e "${RED}无效的选择，请重试${NC}"
                sleep 1
                ;;
        esac
    done
}

# 运行主程序
main