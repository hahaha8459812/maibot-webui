# 如何打包 Maibot WebUI

本文档说明了如何将此项目打包为一个独立、可分发的版本。

## 依赖

-   Python 3
-   pnpm (用于构建前端)

## 打包步骤

1.  **安装前端依赖**:

    在 `frontend` 目录下打开终端，运行以下命令来安装所有必需的依赖项：

    ```bash
    pnpm install
    ```

2.  **构建前端项目**:

    安装完依赖后，运行以下命令来构建生产版本的前端静态文件：

    ```bash
    pnpm build
    ```

    这将在 `frontend/dist` 目录下生成所有必要的文件。

3.  **准备分发文件**:

    创建一个新的目录（例如 `maibot-webui-release`），然后将以下文件和目录从项目根目录复制到其中：

    -   `backend/`
    -   `frontend/dist/` (重命名为 `dist/`)
    -   `run.py`
    -   `start.bat`
    -   `start.sh`
    -   `README.md`

    **注意**: 在复制 `frontend/dist` 时，最好将其在目标目录中重命名为 `dist`，以保持路径的简洁性。同时，您需要相应地更新 `backend/main.py` 中 `FRONTEND_DIST_DIR` 的路径。

    或者，更简单的方法是，直接在当前项目结构下分发，因为 `run.py` 脚本会自动处理一切。只需确保 `frontend/dist` 目录是最新的即可。

4.  **完成**:

    现在，您可以将 `maibot-webui-release` 目录压缩并分发给用户。用户只需运行 `start.bat` (Windows) 或 `start.sh` (Linux/macOS) 即可启动应用。