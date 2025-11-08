import json
import os
import shutil
import subprocess

import toml
import tomlkit
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

# --- App Initialization ---
app = FastAPI()

# --- Path Configuration ---
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
FRONTEND_DIST_DIR = os.path.join(PROJECT_ROOT, "frontend", "dist")
CONFIG_DIR = os.path.join(PROJECT_ROOT, "config")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")
CONFIG_EXAMPLE_FILE = os.path.join(CONFIG_DIR, "config.example.json")
VALID_DEPLOYMENT_MODES = {"docker", "linux"}

DEFAULT_PERSISTED_CONFIG = {
    "bot_config_path": "",
    "env_path": "",
    "model_config_path": "",
    "webui_password": "",
    "deployment_mode": "docker",
    "project_root_path": "",
    "adapter_config_path": "",
}

# --- CORS Configuration (Only for development) ---
# In production, this is not needed, but we keep it for easy switching back.
# origins = [
#     "http://localhost:5173",
#     "http://localhost:3000",
# ]
# 
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# --- Pydantic Models ---
class ConfigPathModel(BaseModel):
    bot_config_path: str
    env_path: str
    model_config_path: str
    webui_password: Optional[str] = None
    adapter_config_path: Optional[str] = None
    project_root_path: Optional[str] = None
    deployment_mode: Optional[str] = "docker"


class AuthRequest(BaseModel):
    password: str = ""

# --- Helper Functions ---
def ensure_config_storage():
    """
    Makes sure the config directory and config file exist.
    If config.json is missing, create it from the example file (when present)
    or fall back to the default structure.
    """
    os.makedirs(CONFIG_DIR, exist_ok=True)
    if not os.path.exists(CONFIG_FILE):
        if os.path.exists(CONFIG_EXAMPLE_FILE):
            shutil.copyfile(CONFIG_EXAMPLE_FILE, CONFIG_FILE)
        else:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_PERSISTED_CONFIG, f, ensure_ascii=False, indent=2)


def load_persisted_config() -> Dict[str, str]:
    """
    读取 config/config.json，如果缺失或损坏则回退到默认结构。
    """
    ensure_config_storage()
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        data = DEFAULT_PERSISTED_CONFIG.copy()

    for key, default_value in DEFAULT_PERSISTED_CONFIG.items():
        data.setdefault(key, default_value)

    raw_password = data.get("webui_password", "") or ""
    if raw_password and any(ch.isspace() for ch in raw_password):
        print("检测到包含空格的 WebUI 密码，已自动清空，请重新设置。")
        raw_password = ""

    data["webui_password"] = raw_password
    return data


def persist_config_to_disk(paths: Dict[str, str], password: str) -> None:
    """将当前路径和 WebUI 密码写入 config/config.json。"""
    ensure_config_storage()
    payload = {
        "bot_config_path": paths.get("bot_config", ""),
        "env_path": paths.get("env", ""),
        "model_config_path": paths.get("model_config", ""),
        "webui_password": password or "",
        "deployment_mode": deployment_mode,
        "project_root_path": project_root_path,
        "adapter_config_path": paths.get("adapter_config", ""),
    }
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def sanitize_path(path: str) -> str:
    """Normalizes incoming Windows-style paths."""
    return path.replace("\\", "/") if path else path


def normalize_password_input(raw_password: Optional[str]) -> Optional[str]:
    """
    校验并返回密码：
    - None 表示不修改
    - 空串表示清空密码
    - 其他值禁止包含任何空白字符
    """
    if raw_password is None:
        return None
    if raw_password == "":
        return ""
    if any(ch.isspace() for ch in raw_password):
        raise HTTPException(status_code=400, detail="WebUI 密码不能包含空格")
    return raw_password


def verify_webui_access(
    password_header: Optional[str] = Header(default=None, alias="X-Webui-Password"),
):
    """
    校验 WebUI 密码。仅当配置了密码时才校验。
    """
    if webui_password and password_header != webui_password:
        raise HTTPException(status_code=401, detail="WebUI 密码不正确")


# --- In-memory storage for config paths & password ---
persisted_config = load_persisted_config()
config_paths: Dict[str, str] = {
    "bot_config": sanitize_path(persisted_config.get("bot_config_path", "") or ""),
    "env": sanitize_path(persisted_config.get("env_path", "") or ""),
    "model_config": sanitize_path(persisted_config.get("model_config_path", "") or ""),
    "adapter_config": sanitize_path(persisted_config.get("adapter_config_path", "") or ""),
}
webui_password: str = persisted_config.get("webui_password", "") or ""
deployment_mode: str = persisted_config.get("deployment_mode", "docker") or "docker"
if deployment_mode not in VALID_DEPLOYMENT_MODES:
    deployment_mode = "docker"
project_root_path: str = sanitize_path(persisted_config.get("project_root_path", "") or "")


def deep_update(source, overrides):
    """
    Recursively update a tomlkit document or table.
    - Updates existing keys.
    - Adds new keys if they don't exist in the source.
    - Deletes keys from the source if their value in overrides is None.
    """
    for key, value in overrides.items():
        if value is None and key in source:
            del source[key]
        elif isinstance(value, dict):
            if key not in source or not isinstance(source.get(key), dict):
                source[key] = tomlkit.table()
            deep_update(source[key], value)
        elif isinstance(value, list):
             # For arrays of tables, replace the whole array.
             # This is a trade-off for UI simplicity.
            source[key] = value
        else:
            source[key] = value
    return source

# --- API Endpoints ---

@app.get("/api/auth/status")
def auth_status():
    return {"password_required": bool(webui_password)}


@app.post("/api/auth/login")
def auth_login(payload: AuthRequest):
    if not webui_password:
        return {"authenticated": True, "password_required": False}
    if payload.password == webui_password:
        return {"authenticated": True, "password_required": True}
    raise HTTPException(status_code=401, detail="WebUI 密码错误")


@app.get("/api/config-paths")
def get_config_paths(_: None = Depends(verify_webui_access)):
    return {
        "bot_config_path": config_paths["bot_config"],
        "env_path": config_paths["env"],
        "model_config_path": config_paths["model_config"],
        "webui_password_set": bool(webui_password),
        "webui_password": webui_password,
        "adapter_config_path": config_paths["adapter_config"],
        "project_root_path": project_root_path,
        "deployment_mode": deployment_mode,
    }


@app.post("/api/config-paths")
def set_config_paths(paths: ConfigPathModel, _: None = Depends(verify_webui_access)):
    global config_paths
    global webui_password
    global deployment_mode
    global project_root_path
    config_paths["bot_config"] = sanitize_path(paths.bot_config_path)
    config_paths["env"] = sanitize_path(paths.env_path)
    config_paths["model_config"] = sanitize_path(paths.model_config_path)
    config_paths["adapter_config"] = sanitize_path(paths.adapter_config_path) if paths.adapter_config_path else config_paths.get("adapter_config", "")

    requested_mode = (paths.deployment_mode or deployment_mode or "docker").lower()
    if requested_mode not in VALID_DEPLOYMENT_MODES:
        raise HTTPException(status_code=400, detail="部署模式不支持")

    for key in ("bot_config", "env", "model_config"):
        path = config_paths.get(key, "")
        if not path or not os.path.exists(path):
            raise HTTPException(status_code=400, detail=f"路径无效或文件不存在: {key} at path: {path}")

    if requested_mode == "linux":
        adapter_path = config_paths.get("adapter_config", "")
        if not adapter_path:
            raise HTTPException(status_code=400, detail="Linux 部署需要提供 adapter config.toml 的路径")
        if not os.path.exists(adapter_path):
            raise HTTPException(status_code=400, detail=f"adapter_config 路径无效: {adapter_path}")
        project_root_candidate = ""
    else:
        adapter_path = config_paths.get("adapter_config", "")
        project_root_candidate = sanitize_path(paths.project_root_path) if paths.project_root_path else project_root_path
        if project_root_candidate and not os.path.isdir(project_root_candidate):
            raise HTTPException(status_code=400, detail=f"项目根目录无效: {project_root_candidate}")

    project_root_path = project_root_candidate
    deployment_mode = requested_mode

    normalized_password = normalize_password_input(paths.webui_password)
    if normalized_password is not None:
        webui_password = normalized_password

    persist_config_to_disk(config_paths, webui_password)
    return {"message": "Configuration paths saved successfully."}

@app.get("/api/config/{config_name}")
def get_config(config_name: str, _: None = Depends(verify_webui_access)) -> Dict[str, Any]:
    if config_name not in config_paths:
        raise HTTPException(status_code=404, detail="Config name not found.")
    
    path = config_paths[config_name]
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Path for {config_name} not set or file not found.")

    try:
        if config_name == "env":
            env_vars = {}
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    if '=' in line and not line.strip().startswith('#'):
                        key, value = line.strip().split('=', 1)
                        env_vars[key] = value
            return env_vars
        else:
            with open(path, 'r', encoding='utf-8') as f:
                return tomlkit.parse(f.read()).unwrap()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file {config_name}: {str(e)}")

@app.put("/api/config/{config_name}")
def update_config(
    config_name: str,
    data: Dict[str, Any],
    _: None = Depends(verify_webui_access),
):
    if config_name not in config_paths:
        raise HTTPException(status_code=404, detail="Config name not found.")

    path = config_paths[config_name]
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Path for {config_name} not set or file not found.")

    try:
        if config_name == "env":
            with open(path, 'w', encoding='utf-8') as f:
                for key, value in data.items():
                    f.write(f"{key}={value}\n")
        else:
            with open(path, 'r', encoding='utf-8') as f:
                doc = tomlkit.parse(f.read())
            
            deep_update(doc, data)

            with open(path, 'w', encoding='utf-8') as f:
                f.write(tomlkit.dumps(doc))

        return {"message": f"{config_name} updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error writing to file {config_name}: {str(e)}")


@app.get("/api/docker/logs")
def get_docker_logs(limit: int = 200, _: None = Depends(verify_webui_access)):
    if deployment_mode != "docker":
        raise HTTPException(status_code=400, detail="当前部署模式不支持日志查看。")
    if not project_root_path or not os.path.isdir(project_root_path):
        raise HTTPException(status_code=400, detail="请先在“文件路径设置”中填写项目根目录。")

    tail = max(50, min(limit, 2000))
    cmd = ["docker", "compose", "logs", "--tail", str(tail)]

    try:
        result = subprocess.run(
            cmd,
            cwd=project_root_path,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="系统中未找到 docker 命令。")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="获取日志超时。")

    if result.returncode != 0:
        stderr = result.stderr.strip() or "获取日志失败"
        raise HTTPException(status_code=500, detail=stderr)

    return {"logs": result.stdout}

# --- Static Files Serving ---
assets_path = os.path.join(FRONTEND_DIST_DIR, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if not os.path.exists(index_path):
        return {"message": "Frontend not built. Please run 'pnpm build' in the 'frontend' directory."}
    return FileResponse(index_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=28517)
