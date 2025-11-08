# Maibot 配置 WebUI

<div align="center">

一个用于编辑 Maibot 相关配置文件的现代化 Web 界面

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 📖 简介

这是一个用于编辑 Maibot 相关配置文件的 Web 界面，包括 `bot_config.toml`、`model_config.toml` 和 `.env` 文件。

通过直观的表单界面，您可以轻松管理 Maibot 的所有配置项，无需手动编辑 TOML 文件。本项目由 FastAPI (Python) 后端和 React (Vite) 前端构成，并已打包为一个独立的、一键启动的应用程序。

## ✨ 主要功能

-### 核心功能
- 🗂️ **文件路径管理** - 通过 Web 界面设置核心配置文件的路径
- 📝 **可视化编辑** - 以表单的形式直观地编辑所有配置项
- ➕ **动态列表管理** - 轻松增删 `api_providers`、`models` 等列表项
- 💾 **格式保留** - 保存 TOML 文件时完好保留原有的注释和格式
- 🔀 **部署模式切换** - 在 Docker 与 Linux 直接部署模式间一键切换，自动展示所需的路径字段
- 🧩 **插件广场** - 内嵌 Maibot 官方插件网站，随时浏览新插件
- 📡 **容器日志查看** - Docker 模式可直接在 WebUI 内获取 `docker compose logs`
- 📊 **操作日志** - 内置日志页面记录所有 WebUI 操作

### 界面特性
- 🌙 **全局暗色主题** - 默认即为暗色方案，便于长时间运维
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🎨 **现代化 UI** - 基于 Ant Design 组件库
- ⚡ **实时反馈** - 所有操作都有即时的成功/失败反馈

## 🚀 快速开始

### 前置要求

- Python 3.8 或更高版本
- （可选）如需修改前端：[pnpm](https://pnpm.io/installation)

### 一键启动

本项目已经打包完成，提供了一键启动脚本，会自动创建虚拟环境、安装依赖并启动服务。

#### Windows 用户

直接双击运行 `start.bat` 文件即可。

#### Linux / macOS 用户

在项目根目录下打开终端，首先给脚本添加执行权限：

```bash
chmod +x start.sh
```

然后运行脚本启动应用：

```bash
./start.sh
```

**Linux 管理菜单**：Linux 版本提供了交互式菜单，包含启动/停止/重启服务、查看状态、注册 systemd 服务等功能。
启动脚本会自动创建虚拟环境并在后台创建一个名为 `maibot-webui-session` 的 `screen` 会话来运行 WebUI。通过菜单的“停止服务”会直接关闭该会话；日志输出仍保存在 `maibot-webui.log` 中，如需手动查看可使用 `screen -r maibot-webui-session` 重新附着。

### 访问 Web UI

脚本会自动完成所有准备工作。当您在终端中看到类似以下输出时：

```
INFO:     Uvicorn running on http://0.0.0.0:28517 (Press CTRL+C to quit)
```

即可打开浏览器访问 [http://localhost:28517](http://localhost:28517)

## 📁 项目结构

```
maibot-webui/
├── backend/                 # FastAPI 后端
│   ├── main.py             # 主应用文件
│   └── requirements.txt    # Python 依赖
├── frontend/               # React 前端
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── contexts/      # React Context
│   │   └── api.js         # API 客户端
│   ├── dist/              # 打包后的静态文件
│   └── package.json       # 前端依赖
├── 范例/                   # 配置文件模板
├── run.py                 # 启动器脚本
├── start.bat              # Windows 启动脚本
├── start.sh               # Linux/macOS 启动脚本
├── PACKAGING.md           # 打包说明文档
└── README.md              # 本文件
```

> ℹ️ **配置存储**：项目根目录会维护一个 `config/config.json` 文件（由 `config/config.example.json` 初始化），用于持久化 WebUI 中“文件路径设置”页面填写的内容及 WebUI 密码。若 `config` 目录缺失，后端会在启动时自动创建并填充范例文件。

## 🎯 使用指南

### 1. 设置配置文件路径

首次使用时，在“文件路径设置”页面选择部署方式并输入三个配置文件的**绝对路径**，所有设置会持久化在 `config/config.json` 中，重启后自动恢复：

- 若发现页面未自动回填，可在“文件路径设置”页点击“手动加载配置”按钮强制重新读取。

- `bot_config.toml` - Bot 配置文件
- `model_config.toml` - 模型配置文件
- `.env` - 环境变量文件
- **WebUI 密码（可选）** - 页面底部的输入框用于设置/修改 WebUI 登录密码；留空保存表示不修改，清空后保存即可移除密码。
- ⚠️ WebUI 密码不允许包含任何空格字符（包含首尾或中间空格），否则会被服务器拒绝。

#### 部署模式字段说明

- **Docker 模式（默认）**
  - 除上述三个文件外，可额外填写 `项目根目录`（`docker-compose.yml` 所在目录），用于 WebUI 在后台执行 `docker compose logs` 获取容器日志。
  - “容器日志”菜单可用，方便直接在浏览器中查看 `docker compose` 的输出。
- **Linux 模式**
  - 需要额外指定 **Adapter 配置文件 (config.toml)** 的路径，用于宿主机运行的 Napcat Adapter。
  - 不提供容器日志页面（菜单会自动隐藏）。

#### WebUI 密码说明

- 如果设置了 WebUI 密码，访问页面前会先显示登录框。密码输入正确后才会加载各项配置。
- 密码信息与路径一样保存在 `config/config.json`，可随时通过页面更新；修改成功后需要重新登录。
- 将密码留空并保存即可关闭登录保护，页面将直接进入配置视图。

**示例**（Windows）：
```
C:\Users\YourUser\maibot\bot_config.toml
C:\Users\YourUser\maibot\model_config.toml
C:\Users\YourUser\maibot\.env
```

**示例**（Linux/macOS）：
```
/home/youruser/maibot/bot_config.toml
/home/youruser/maibot/model_config.toml
/home/youruser/maibot/.env
```

### 2. 编辑配置

配置文件路径设置完成后，您可以通过左侧导航栏访问各个配置页面：

- **Bot 配置** - 编辑机器人的性格、行为、功能设置等
- **模型配置** - 管理 API 提供商和模型配置
- **环境配置** - 编辑环境变量（如 HOST、PORT 等）

### 3. 查看日志

在"应用日志"页面可以查看所有操作的详细日志，包括：
- ✅ 成功操作（绿色标签）
- ℹ️ 信息提示（蓝色标签）
- ❌ 错误信息（红色标签）

每条日志都包含时间戳和详细描述，便于调试和问题排查。

## 🔧 开发模式

如果您需要修改前端 UI（例如调整布局、添加新功能），请按照以下步骤操作：

### 1. 安装前端依赖

确保您的电脑上已安装 [pnpm](https://pnpm.io/installation)。

在 `frontend` 目录下运行：

```bash
cd frontend
pnpm install
```

### 2. 启动开发服务器

您需要同时启动两个开发服务器：

**终端 1 - 后端服务器**：
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 28517
```

**终端 2 - 前端服务器**：
```bash
cd frontend
pnpm dev
```

前端开发服务器通常会在 `http://localhost:5173` 启动。

### 3. 进行修改

现在您可以修改 `frontend/src` 目录下的代码。所有修改都会在浏览器中即时生效（热重载）。

### 4. 重新打包

完成前端修改后，重新打包：

```bash
cd frontend
pnpm build
```

这会生成最新的静态文件到 `frontend/dist` 目录，生产模式下会自动加载这些新文件。

## 🛠️ 技术栈

### 后端
- **FastAPI** - 现代、快速的 Web 框架
- **Uvicorn** - ASGI 服务器
- **tomlkit** - TOML 解析器（保留注释和格式）
- **python-dotenv** - 环境变量管理

### 前端
- **React 18** - UI 框架
- **Vite** - 构建工具
- **Ant Design** - UI 组件库
- **React Router** - 路由管理
- **Axios** - HTTP 客户端

## 📦 打包部署

详细的打包说明请参考 [PACKAGING.md](PACKAGING.md) 文件。

简要步骤：

1. 安装前端依赖并构建：
   ```bash
   cd frontend
   pnpm install
   pnpm build
   ```

2. 将以下文件打包分发：
   - `backend/` 目录
   - `frontend/dist/` 目录
   - `run.py`
   - `start.bat` / `start.sh`
   - `README.md`

用户只需运行 `start.bat` (Windows) 或 `start.sh` (Linux/macOS) 即可启动应用。

## ❓ 常见问题

### Q: 启动时提示端口被占用怎么办？

A: 默认端口是 28517。如果被占用，可以修改 `backend/main.py` 文件最后一行的端口号：

```python
uvicorn.run(app, host="0.0.0.0", port=28517)  # 改为其他端口
```

### Q: 配置文件保存后格式乱了怎么办？

A: 本项目使用 `tomlkit` 库，专门设计用于保留 TOML 文件的格式和注释。如果仍然出现格式问题，请检查：
1. 确保使用的是最新版本
2. 检查原始文件的 TOML 格式是否正确

### Q: 如何备份配置文件？

A: 建议在修改配置前：
1. 手动复制配置文件到安全位置
2. 或使用版本控制系统（如 Git）管理配置文件

### Q: 可以同时编辑多个 Maibot 实例的配置吗？

A: 可以。只需在"文件路径设置"页面切换不同实例的配置文件路径即可。路径会在内存中保存，重启应用后需要重新设置。

### Q: 如何将应用注册为系统服务（开机自启）？

A: 使用启动脚本的菜单功能：

**Windows**:
1. 下载 [NSSM (Non-Sucking Service Manager)](https://nssm.cc/download)
2. 运行 `start.bat`，选择"[5] 注册为系统服务"
3. 按照提示操作，需要管理员权限

**Linux**:
1. 使用 `sudo` 运行启动脚本: `sudo ./start.sh`
2. 选择"[5] 注册为系统服务"
3. 服务将自动注册到 systemd

### Q: 如何查看服务日志？

A: 日志文件位于项目根目录的 `maibot-webui.log`，可以使用以下命令查看：

**Windows**:
```cmd
type maibot-webui.log
```

**Linux/macOS**:
```bash
tail -f maibot-webui.log  # 实时查看
cat maibot-webui.log      # 查看全部内容
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果您发现了 Bug 或有新功能建议，请：
1. 在 GitHub 上创建 Issue 详细描述问题
2. Fork 本仓库并创建功能分支
3. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- [Maibot 项目](https://github.com/MaiM-with-RdCd/MaiM) - 主项目仓库
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [React 文档](https://react.dev/)
- [Ant Design 文档](https://ant.design/)

## 💬 支持

如有问题或需要帮助，请通过以下方式联系：

- 提交 GitHub Issue
- 加入项目讨论组

---

<div align="center">
Made with ❤️ for Maibot
</div>
