#!/usr/bin/env python3
"""
Dating Platform - Unified Startup Script
Запускает backend (Flask) и frontend (Vite) одновременно
"""

import subprocess
import sys
import os
import signal
import time
import threading
from pathlib import Path

# Цвета для консоли
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    """Печатает красивый баннер"""
    banner = f"""
{Colors.CYAN}╔══════════════════════════════════════════════════════════════╗
║                                                                ║
║  {Colors.RED}♥{Colors.CYAN}  {Colors.BOLD}DATING PLATFORM{Colors.END}{Colors.CYAN}                                        ║
║     Development Server                                         ║
║                                                                ║
╠══════════════════════════════════════════════════════════════╣
║  {Colors.GREEN}Backend:{Colors.CYAN}   http://localhost:5000                            ║
║  {Colors.BLUE}Frontend:{Colors.CYAN}  http://localhost:3000                            ║
╚══════════════════════════════════════════════════════════════╝{Colors.END}
"""
    print(banner)

def check_requirements():
    """Проверяет наличие необходимых инструментов"""
    errors = []
    
    # Проверка Python
    print(f"{Colors.YELLOW}[CHECK]{Colors.END} Python version: {sys.version.split()[0]}")
    
    # Проверка Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        print(f"{Colors.YELLOW}[CHECK]{Colors.END} Node.js version: {result.stdout.strip()}")
    except FileNotFoundError:
        errors.append("Node.js не установлен! Скачайте с https://nodejs.org/")
    
    # Проверка npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        print(f"{Colors.YELLOW}[CHECK]{Colors.END} npm version: {result.stdout.strip()}")
    except FileNotFoundError:
        errors.append("npm не найден!")
    
    if errors:
        print(f"\n{Colors.RED}[ERROR] Обнаружены проблемы:{Colors.END}")
        for error in errors:
            print(f"  - {error}")
        return False
    
    return True

def load_env():
    """Загружает переменные окружения из .env файла"""
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        print(f"{Colors.GREEN}[ENV]{Colors.END} Загружаем .env из {env_path}")
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    else:
        print(f"{Colors.YELLOW}[WARN]{Colors.END} Файл .env не найден")

def install_dependencies():
    """Устанавливает зависимости если нужно"""
    root_dir = Path(__file__).parent
    backend_dir = root_dir / 'backend'
    frontend_dir = root_dir / 'frontend'
    
    # Проверяем backend зависимости
    if not (backend_dir / '__pycache__').exists():
        print(f"{Colors.YELLOW}[INSTALL]{Colors.END} Устанавливаем Python зависимости...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'],
                      cwd=backend_dir, capture_output=True)
    
    # Проверяем frontend зависимости
    if not (frontend_dir / 'node_modules').exists():
        print(f"{Colors.YELLOW}[INSTALL]{Colors.END} Устанавливаем npm зависимости...")
        subprocess.run(['npm', 'install'], cwd=frontend_dir, capture_output=True)

class ServerProcess:
    """Класс для управления серверным процессом"""
    
    def __init__(self, name, command, cwd, color):
        self.name = name
        self.command = command
        self.cwd = cwd
        self.color = color
        self.process = None
        self.thread = None
    
    def start(self):
        """Запускает процесс в отдельном потоке"""
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
    
    def _run(self):
        """Запускает и мониторит процесс"""
        try:
            # Используем shell=True на Windows для корректной работы
            if sys.platform == 'win32':
                self.process = subprocess.Popen(
                    self.command,
                    cwd=self.cwd,
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
                )
            else:
                self.process = subprocess.Popen(
                    self.command.split(),
                    cwd=self.cwd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    preexec_fn=os.setsid
                )
            
            # Читаем и выводим вывод процесса
            for line in self.process.stdout:
                line = line.rstrip()
                if line:
                    print(f"{self.color}[{self.name}]{Colors.END} {line}")
                    
        except Exception as e:
            print(f"{Colors.RED}[{self.name} ERROR]{Colors.END} {e}")
    
    def stop(self):
        """Останавливает процесс"""
        if self.process:
            try:
                if sys.platform == 'win32':
                    # На Windows используем taskkill
                    subprocess.run(['taskkill', '/F', '/T', '/PID', str(self.process.pid)],
                                 capture_output=True)
                else:
                    os.killpg(os.getpgid(self.process.pid), signal.SIGTERM)
            except Exception:
                pass

def main():
    """Главная функция запуска"""
    print_banner()
    
    # Проверяем требования
    if not check_requirements():
        sys.exit(1)
    
    print()
    
    # Загружаем .env
    load_env()
    
    # Устанавливаем зависимости если нужно
    install_dependencies()
    
    root_dir = Path(__file__).parent
    backend_dir = root_dir / 'backend'
    frontend_dir = root_dir / 'frontend'
    
    # Создаем серверные процессы
    backend = ServerProcess(
        name="BACKEND",
        command=f"{sys.executable} run.py",
        cwd=backend_dir,
        color=Colors.GREEN
    )
    
    frontend = ServerProcess(
        name="FRONTEND",
        command="npm run dev",
        cwd=frontend_dir,
        color=Colors.BLUE
    )
    
    # Запускаем серверы
    print(f"\n{Colors.CYAN}[START]{Colors.END} Запуск серверов...\n")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}")
    
    backend.start()
    time.sleep(2)  # Даём бэкенду время на запуск
    frontend.start()
    
    print(f"\n{Colors.GREEN}[INFO]{Colors.END} Нажмите Ctrl+C для остановки серверов\n")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}\n")
    
    # Ждём завершения
    try:
        while True:
            time.sleep(1)
            # Проверяем, что процессы ещё работают
            if backend.process and backend.process.poll() is not None:
                print(f"{Colors.RED}[ERROR]{Colors.END} Backend остановился неожиданно")
                break
            if frontend.process and frontend.process.poll() is not None:
                print(f"{Colors.RED}[ERROR]{Colors.END} Frontend остановился неожиданно")
                break
                
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}[STOP]{Colors.END} Останавливаем серверы...")
    
    # Останавливаем процессы
    frontend.stop()
    backend.stop()
    
    print(f"{Colors.GREEN}[DONE]{Colors.END} Серверы остановлены. До свидания! {Colors.RED}♥{Colors.END}\n")

if __name__ == '__main__':
    main()
