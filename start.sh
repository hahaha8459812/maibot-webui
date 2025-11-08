#!/bin/bash

# 获取脚本所在的目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 使用 python3 执行启动器脚本
python3 "$SCRIPT_DIR/run.py"