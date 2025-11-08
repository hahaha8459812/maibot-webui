import os
import sys
import subprocess
import venv

def get_python_executable():
    """Gets the python executable in a cross-platform way."""
    return sys.executable

def create_virtual_env(venv_dir):
    """Creates a virtual environment."""
    print(f"创建虚拟环境到: {venv_dir}")
    venv.create(venv_dir, with_pip=True)

def get_pip_executable(venv_dir):
    """Gets the pip executable path from the virtual environment."""
    if sys.platform == "win32":
        return os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        return os.path.join(venv_dir, "bin", "pip")

def get_python_in_venv(venv_dir):
    """Gets the python executable path from the virtual environment."""
    if sys.platform == "win32":
        return os.path.join(venv_dir, "Scripts", "python.exe")
    else:
        return os.path.join(venv_dir, "bin", "python")

def install_dependencies(venv_dir, requirements_file):
    """Installs dependencies from a requirements file into the virtual environment."""
    pip_executable = get_pip_executable(venv_dir)
    print("正在安装或更新依赖...")
    subprocess.check_call([pip_executable, "install", "-r", requirements_file])

def main():
    """Main function to set up environment and run the app."""
    project_root = os.path.dirname(os.path.abspath(__file__))
    venv_dir = os.path.join(project_root, ".venv")
    requirements_file = os.path.join(project_root, "backend", "requirements.txt")
    main_app_file = os.path.join(project_root, "backend", "main.py")

    if not os.path.exists(venv_dir):
        create_virtual_env(venv_dir)
    
    try:
        install_dependencies(venv_dir, requirements_file)
    except subprocess.CalledProcessError as e:
        print(f"依赖安装失败: {e}")
        sys.exit(1)

    python_in_venv = get_python_in_venv(venv_dir)
    print("依赖安装完成。正在启动 Maibot WebUI...")
    
    try:
        # Run the main.py file using the virtual environment's python
        subprocess.run([python_in_venv, main_app_file], check=True)
    except KeyboardInterrupt:
        print("\n服务器已手动关闭。")
    except Exception as e:
        print(f"启动服务器时出错: {e}")

if __name__ == "__main__":
    main()