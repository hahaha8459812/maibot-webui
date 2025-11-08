# Maibot 配置 WebUI

这是一个用于编辑 Maibot 相关配置文件的 Web 界面，包括 `bot_config.toml`, `model_config.toml`, 和 `.env` 文件。

它由一个 FastAPI (Python) 后端和一个 React (Vite) 前端构成，并已打包为一个独立的、一键启动的应用程序。

## ✨ 功能

-   通过 Web 界面设置三个核心配置文件的路径。
-   以表单的形式直观地编辑所有配置项。
-   动态增删 `api_providers` 和 `models` 等列表项。
-   在保存 TOML 文件时，能够完好地保留原有的注释和格式。
-   内置一个“应用日志”页面，用于记录所有操作的成功与失败信息，便于调试。

## 🚀 如何运行 (一键启动)

本项目已经打包，并提供了一键启动脚本，它会自动创建虚拟环境、安装依赖并启动服务。

1.  **确保已安装 Python 3**。

2.  **运行启动脚本**:
    *   **对于 Windows 用户**:
        直接双击运行 `start.bat` 文件。
    *   **对于 Linux / macOS 用户**:
        在项目根目录下打开终端，首先给 `start.sh` 脚本添加执行权限：
        ```bash
        chmod +x start.sh
        ```
        然后运行脚本来启动应用：
        ```bash
        ./start.sh
        ```

3.  **访问 Web UI**:
    脚本会自动完成所有准备工作。当您在终端中看到类似 `Uvicorn running on http://0.0.0.0:28517` 的输出时，即可打开浏览器访问 [http://localhost:28517](http://localhost:28517)。

## 🔧 如何返回开发模式 (修改前端)

如果您需要修改前端 UI（例如调整布局、添加新功能），请按照以下步骤操作：

1.  **安装前端依赖**:
    确保您的电脑上已安装 [pnpm](https://pnpm.io/installation)。然后，在 `frontend` 目录下打开终端，运行以下命令：
    ```bash
    pnpm install
    ```

2.  **启动开发服务器**:
    您需要同时启动两个开发服务器：
    *   **后端服务器**: 在 `backend` 目录下运行 `uvicorn main:app --reload`。
    *   **前端服务器**: 在 `frontend` 目录下运行 `pnpm dev`。

3.  **进行修改**:
    现在您可以修改 `frontend/src` 目录下的代码了。所有修改都会在浏览器中即时生效。

4.  **重新打包**:
    当您完成前端修改后，在 `frontend` 目录下运行以下命令来重新打包：
    ```bash
    pnpm build
    ```
    这会生成最新的静态文件到 `frontend/dist` 目录，生产模式下会自动加载这些新文件。