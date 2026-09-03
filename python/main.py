import uvicorn
import webbrowser
import threading
import time
from .config import HOST, PORT

def open_browser():
    time.sleep(1.2)
    webbrowser.open(f"http://{HOST}:{PORT}")

def main():
    print("=" * 70)
    print("  SUMO + TraCI Traffic Simulation Digital Twin Engine")
    print(f"  Starting web dashboard at: http://{HOST}:{PORT}")
    print("=" * 70)
    
    # Launch browser automatically
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run FastAPI server
    uvicorn.run("python.server:app", host=HOST, port=PORT, log_level="info")

if __name__ == "__main__":
    main()
