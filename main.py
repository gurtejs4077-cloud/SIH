#!/usr/bin/env python3
"""
=============================================================================
 Real-Time Indian Airfare Price Intelligence Platform (SIH 2026 Prototype)
 Single-Command Platform Launcher
=============================================================================
Usage:
    python main.py
    or double-click start.bat

This script:
 1. Performs system diagnostic checks (Python 3.10+, Node.js, npm).
 2. Validates backend Python dependencies and frontend node_modules.
 3. Automatically seeds the database if it is not yet populated.
 4. Launches the FastAPI Backend server on http://localhost:8000.
 5. Launches the Vite + React Frontend on http://localhost:5173.
 6. Opens the dashboard automatically in your default browser.
 7. Provides clean Ctrl+C shutdown terminating all child processes on Windows.
=============================================================================
"""

import sys
import os
import time
import shutil
import signal
import socket
import urllib.request
import webbrowser
import subprocess
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
DB_PATH = BACKEND_DIR / "airfare_intelligence.db"

# ANSI Colors for terminal output
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

def log_info(msg: str):
    print(f"{CYAN}[INFO]{RESET} {msg}")

def log_ok(msg: str):
    print(f"{GREEN}[OK]{RESET} {msg}")

def log_warn(msg: str):
    print(f"{YELLOW}[WARN]{RESET} {msg}")

def log_err(msg: str):
    print(f"{RED}[ERROR]{RESET} {msg}")

def print_banner():
    banner = f"""
{CYAN}{BOLD}================================================================================
     Real-Time Indian Airfare Price Intelligence Platform
     Smart India Hackathon (SIH 2026) Prototype Launcher
================================================================================{RESET}
  {DIM}* Ministry of Statistics & Programme Implementation (MoSPI) CPI Augmentation
  * Real-Time Laspeyres Fare Index | Anomaly & Spike Forensics | Leaflet Radar{RESET}
--------------------------------------------------------------------------------
"""
    print(banner)

def check_port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) != 0

def kill_process_tree(process):
    if not process:
        return
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(process.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            process.terminate()
            process.wait(timeout=3)
    except Exception:
        try:
            process.kill()
        except Exception:
            pass

def check_environment():
    log_info("Checking system environment and prerequisites...")

    # Python version check
    if sys.version_info < (3, 10):
        log_err(f"Python 3.10+ required. Current: {sys.version.split()[0]}")
        sys.exit(1)
    log_ok(f"Python: {sys.version.split()[0]}")

    # Node.js check
    node_cmd = shutil.which("node")
    if not node_cmd:
        log_err("Node.js is not installed or not in PATH! Please install Node.js from https://nodejs.org/")
        sys.exit(1)
    node_ver = subprocess.run([node_cmd, "--version"], capture_output=True, text=True).stdout.strip()
    log_ok(f"Node.js: {node_ver}")

    # npm check
    npm_cmd = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm_cmd:
        log_err("npm is not installed or not in PATH!")
        sys.exit(1)
    npm_ver = subprocess.run([npm_cmd, "--version"], capture_output=True, text=True).stdout.strip()
    log_ok(f"npm: {npm_ver}")

    # Backend dependencies check
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        import apscheduler
        log_ok("Backend Python packages: Installed")
    except ImportError as e:
        log_warn(f"Missing Python package ({e.name}). Installing backend requirements...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(BACKEND_DIR / "requirements.txt")], check=True)
        log_ok("Backend requirements installed successfully.")

    # Frontend node_modules check
    if not (FRONTEND_DIR / "node_modules").exists():
        log_warn("Frontend dependencies missing (node_modules). Running 'npm install'...")
        subprocess.run([npm_cmd, "install"], cwd=str(FRONTEND_DIR), check=True)
        log_ok("Frontend dependencies installed.")
    else:
        log_ok("Frontend node_modules: Present")

    # WhatsApp Bridge node_modules check
    whatsapp_dir = BACKEND_DIR / "whatsapp_bridge"
    if not (whatsapp_dir / "node_modules").exists():
        log_warn("WhatsApp Gateway dependencies missing. Running 'npm install'...")
        subprocess.run([npm_cmd, "install"], cwd=str(whatsapp_dir), check=True)
        log_ok("WhatsApp Gateway dependencies installed.")
    else:
        log_ok("WhatsApp Gateway: Ready")

    # Database & Seed check
    if not DB_PATH.exists() or DB_PATH.stat().st_size < 10000:
        log_info("Database not found or unseeded. Seeding 30-day realistic baseline data...")
        subprocess.run([sys.executable, "-m", "app.seed"], cwd=str(BACKEND_DIR), check=True)
        log_ok("Database seeded successfully with 7,000+ historical records.")
    else:
        log_ok(f"Database active: {DB_PATH.name} ({DB_PATH.stat().st_size // 1024} KB)")

def wait_for_service(url: str, timeout_sec: int = 15) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout_sec:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status in (200, 304):
                    return True
        except Exception:
            time.sleep(0.5)
    return False

def main():
    print_banner()
    check_environment()

    # Port availability check
    backend_port = 8000
    frontend_port = 5173
    whatsapp_port = 8001

    if not check_port_free(backend_port):
        log_warn(f"Port {backend_port} is already in use. Attempting to proceed anyway...")
    if not check_port_free(frontend_port):
        log_warn(f"Port {frontend_port} is already in use. Attempting to proceed anyway...")
    if not check_port_free(whatsapp_port):
        log_warn(f"Port {whatsapp_port} is already in use. Attempting to proceed anyway...")

    processes = []

    def cleanup():
        print(f"\n{YELLOW}{BOLD}Shutting down services cleanly...{RESET}")
        for p in processes:
            kill_process_tree(p)
        print(f"{GREEN}All services stopped successfully. Goodbye!{RESET}\n")

    def signal_handler(sig, frame):
        cleanup()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, signal_handler)

    try:
        node_cmd = shutil.which("node")

        # 1. Start WhatsApp Gateway Bridge
        whatsapp_dir = BACKEND_DIR / "whatsapp_bridge"
        log_info(f"Starting WhatsApp Multi-Device Gateway on http://localhost:{whatsapp_port}...")
        whatsapp_proc = subprocess.Popen(
            [node_cmd, "server.js"],
            cwd=str(whatsapp_dir),
            stdout=subprocess.DEVNULL if "--quiet" in sys.argv else None,
            stderr=None
        )
        processes.append(whatsapp_proc)

        # 2. Start Backend
        log_info(f"Starting Backend API server on http://localhost:{backend_port}...")
        backend_cmd = [
            sys.executable, "-m", "uvicorn", "app.main:app",
            "--host", "127.0.0.1",
            "--port", str(backend_port),
            "--reload"
        ]
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(BACKEND_DIR),
            stdout=subprocess.DEVNULL if "--quiet" in sys.argv else None,
            stderr=None
        )
        processes.append(backend_proc)

        # Wait for backend healthcheck
        log_info("Waiting for Backend to become healthy...")
        if wait_for_service(f"http://127.0.0.1:{backend_port}/api/health", timeout_sec=12):
            log_ok("Backend API is UP and healthy.")
        else:
            log_warn("Backend healthcheck did not respond in time, proceeding anyway...")

        # 3. Start Frontend
        npm_cmd = shutil.which("npm.cmd") if sys.platform == "win32" else shutil.which("npm")
        log_info(f"Starting Frontend Vite server on http://localhost:{frontend_port}...")
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.DEVNULL if "--quiet" in sys.argv else None,
            stderr=None
        )
        processes.append(frontend_proc)

        # Wait for frontend
        log_info("Waiting for Frontend to initialize...")
        wait_for_service(f"http://localhost:{frontend_port}", timeout_sec=10)

        # 4. Print Ready Card
        print(f"""
{GREEN}{BOLD}================================================================================
              SYSTEM IS FULLY OPERATIONAL AND READY!
================================================================================{RESET}
  {BOLD}* Frontend Dashboard:{RESET}     {CYAN}http://localhost:{frontend_port}{RESET}
  {BOLD}* Backend REST API:{RESET}       {CYAN}http://localhost:{backend_port}{RESET}
  {BOLD}* Interactive Docs (Swagger):{RESET} {CYAN}http://localhost:{backend_port}/docs{RESET}
  {BOLD}* WhatsApp Linked Devices:{RESET}  {CYAN}http://localhost:{whatsapp_port}/status{RESET}
  {BOLD}* CPI Transmission Engine:{RESET}  {CYAN}http://localhost:{frontend_port}/cpi-transmission{RESET}
  {BOLD}* Anomaly & Route Forensics:{RESET} {CYAN}http://localhost:{frontend_port}/routes{RESET}
--------------------------------------------------------------------------------
  {YELLOW}Press Ctrl+C at any time in this terminal to stop all servers cleanly.{RESET}
================================================================================
""")

        # 4. Open browser
        try:
            log_info(f"Opening browser at http://localhost:{frontend_port}...")
            webbrowser.open(f"http://localhost:{frontend_port}")
        except Exception:
            pass

        # 5. Keep main thread alive monitoring processes
        while True:
            time.sleep(1)
            # Check if any child died unexpectedly
            if backend_proc.poll() is not None:
                log_err(f"Backend process terminated unexpectedly (code {backend_proc.returncode}).")
                break
            if frontend_proc.poll() is not None:
                log_err(f"Frontend process terminated unexpectedly (code {frontend_proc.returncode}).")
                break

    except KeyboardInterrupt:
        pass
    finally:
        cleanup()

if __name__ == "__main__":
    main()
