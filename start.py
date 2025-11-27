#!/usr/bin/env python3
"""
Dating Platform - Unified Startup Script
Startet Backend (Flask) und Frontend (Vite) gleichzeitig
"""

import subprocess
import sys
import os
import signal
import time
import threading
from pathlib import Path

# Farben für die Konsole
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
    """Druckt ein schönes Banner"""
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
    """Prüft das Vorhandensein der erforderlichen Tools"""
    errors = []
    
    # Python prüfen
    print(f"{Colors.YELLOW}[CHECK]{Colors.END} Python version: {sys.version.split()[0]}")
    
    # Node.js prüfen
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print(f"{Colors.YELLOW}[CHECK]{Colors.END} Node.js version: {result.stdout.strip()}")
        else:
            errors.append("Node.js ist nicht installiert! Laden Sie es von https://nodejs.org/ herunter")
    except FileNotFoundError:
        errors.append("Node.js ist nicht installiert! Laden Sie es von https://nodejs.org/ herunter")
    
    # npm prüfen
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print(f"{Colors.YELLOW}[CHECK]{Colors.END} npm version: {result.stdout.strip()}")
        else:
            errors.append("npm nicht gefunden!")
    except FileNotFoundError:
        errors.append("npm nicht gefunden!")
    
    if errors:
        print(f"\n{Colors.RED}[ERROR] Probleme gefunden:{Colors.END}")
        for error in errors:
            print(f"  - {error}")
        return False
    
    return True

def load_env():
    """Lädt Umgebungsvariablen aus der .env-Datei"""
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        print(f"{Colors.GREEN}[ENV]{Colors.END} Lade .env aus {env_path}")
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    else:
        print(f"{Colors.YELLOW}[WARN]{Colors.END} .env-Datei nicht gefunden")

def install_dependencies():
    """Installiert Abhängigkeiten falls nötig"""
    root_dir = Path(__file__).parent
    backend_dir = root_dir / 'backend'
    frontend_dir = root_dir / 'frontend'
    
    # Backend-Abhängigkeiten prüfen
    if not (backend_dir / '__pycache__').exists():
        print(f"{Colors.YELLOW}[INSTALL]{Colors.END} Installiere Python-Abhängigkeiten...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'],
                      cwd=backend_dir, capture_output=True)
    
    # Frontend-Abhängigkeiten prüfen
    if not (frontend_dir / 'node_modules').exists():
        print(f"{Colors.YELLOW}[INSTALL]{Colors.END} Installiere npm-Abhängigkeiten...")
        subprocess.run(['npm', 'install'], cwd=frontend_dir, capture_output=True)

class ServerProcess:
    """Klasse zur Verwaltung von Serverprozessen"""
    
    def __init__(self, name, command, cwd, color):
        self.name = name
        self.command = command
        self.cwd = cwd
        self.color = color
        self.process = None
        self.thread = None
    
    def start(self):
        """Startet den Prozess in einem separaten Thread"""
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
    
    def _run(self):
        """Startet und überwacht den Prozess"""
        try:
            # Verwende shell=True unter Windows für korrekte Funktion
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
            
            # Lese und gebe die Prozessausgabe aus
            for line in self.process.stdout:
                line = line.rstrip()
                if line:
                    print(f"{self.color}[{self.name}]{Colors.END} {line}")
                    
        except Exception as e:
            print(f"{Colors.RED}[{self.name} ERROR]{Colors.END} {e}")
    
    def stop(self):
        """Stoppt den Prozess"""
        if self.process:
            try:
                if sys.platform == 'win32':
                    # Unter Windows taskkill verwenden
                    subprocess.run(['taskkill', '/F', '/T', '/PID', str(self.process.pid)],
                                 capture_output=True)
                else:
                    os.killpg(os.getpgid(self.process.pid), signal.SIGTERM)
            except Exception:
                pass

def main():
    """Hauptfunktion für den Start"""
    print_banner()
    
    # Anforderungen prüfen
    if not check_requirements():
        sys.exit(1)
    
    print()
    
    # Lade .env
    load_env()
    
    # Installiere Abhängigkeiten falls nötig
    install_dependencies()
    
    root_dir = Path(__file__).parent
    backend_dir = root_dir / 'backend'
    frontend_dir = root_dir / 'frontend'
    
    # Erstelle Serverprozesse
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
    
    # Starte Server
    print(f"\n{Colors.CYAN}[START]{Colors.END} Starte Server...\n")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}")
    
    backend.start()
    time.sleep(2)  # Gib dem Backend Zeit zum Starten
    frontend.start()
    
    print(f"\n{Colors.GREEN}[INFO]{Colors.END} Drücken Sie Ctrl+C, um die Server zu stoppen\n")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}\n")
    
    # Warte auf Beendigung
    try:
        while True:
            time.sleep(1)
            # Prüfe, ob Prozesse noch laufen
            if backend.process and backend.process.poll() is not None:
                print(f"{Colors.RED}[ERROR]{Colors.END} Backend wurde unerwartet gestoppt")
                break
            if frontend.process and frontend.process.poll() is not None:
                print(f"{Colors.RED}[ERROR]{Colors.END} Frontend wurde unerwartet gestoppt")
                break
                
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}[STOP]{Colors.END} Stoppe Server...")
    
    # Stoppe Prozesse
    frontend.stop()
    backend.stop()
    
    print(f"{Colors.GREEN}[DONE]{Colors.END} Server gestoppt. Auf Wiedersehen! {Colors.RED}♥{Colors.END}\n")

if __name__ == '__main__':
    main()
