import os
import toml
import tomlkit
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, List

# --- App Initialization ---
app = FastAPI()

# --- Path Configuration ---
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
FRONTEND_DIST_DIR = os.path.join(PROJECT_ROOT, "frontend", "dist")

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

# --- In-memory storage for config paths ---
config_paths: Dict[str, str] = {
    "bot_config": "",
    "env": "",
    "model_config": "",
}

# --- Pydantic Models ---
class ConfigPathModel(BaseModel):
    bot_config_path: str
    env_path: str
    model_config_path: str

# --- Helper Functions ---
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

@app.post("/api/config-paths")
def set_config_paths(paths: ConfigPathModel):
    global config_paths
    config_paths["bot_config"] = paths.bot_config_path.replace("\\", "/")
    config_paths["env"] = paths.env_path.replace("\\", "/")
    config_paths["model_config"] = paths.model_config_path.replace("\\", "/")
    
    for key, path in config_paths.items():
        if not os.path.exists(path):
            raise HTTPException(status_code=400, detail=f"路径无效或文件不存在: {key} at path: {path}")
            
    return {"message": "Configuration paths saved successfully."}

@app.get("/api/config/{config_name}")
def get_config(config_name: str) -> Dict[str, Any]:
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
def update_config(config_name: str, data: Dict[str, Any]):
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