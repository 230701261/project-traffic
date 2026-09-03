import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Set

from .config import UI_DIR
from .traci_controller import TraCIController
from .network_exporter import get_network_geometry

app = FastAPI(title="SUMO TraCI Digital Twin Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

controller = TraCIController()
active_connections: Set[WebSocket] = set()

# Pre-cached static network vector geometry
CACHED_GEOMETRY = None

@app.on_event("startup")
async def startup_event():
    global CACHED_GEOMETRY
    CACHED_GEOMETRY = get_network_geometry()
    # Auto-start simulation in normal_day mode
    controller.start("normal_day")
    asyncio.create_task(broadcast_simulation_stream())

@app.on_event("shutdown")
def shutdown_event():
    controller.close()

async def broadcast_simulation_stream():
    """Streams live TraCI simulation state to all connected UI clients."""
    while True:
        if active_connections and controller.latest_state:
            state_data = controller.latest_state
            # Serialize
            msg = json.dumps(state_data)
            dead_sockets = set()
            for ws in list(active_connections):
                try:
                    await ws.send_text(msg)
                except Exception:
                    dead_sockets.add(ws)
            active_connections.difference_update(dead_sockets)
        await asyncio.sleep(0.033)  # ~30 FPS broadcast rate

@app.get("/api/network/geometry")
async def get_geometry():
    global CACHED_GEOMETRY
    if CACHED_GEOMETRY is None:
        CACHED_GEOMETRY = get_network_geometry()
    return JSONResponse(content=CACHED_GEOMETRY)

@app.get("/api/comparison")
async def get_comparison():
    return JSONResponse(content=controller.metrics.get_comparison())

@app.post("/api/control/start")
async def control_start(scenario: str = "normal_day"):
    success = controller.start(scenario)
    return {"status": "ok", "running": success, "scenario": scenario}

@app.post("/api/control/pause")
async def control_pause():
    controller.pause()
    return {"status": "ok", "paused": True}

@app.post("/api/control/resume")
async def control_resume():
    controller.resume()
    return {"status": "ok", "paused": False}

@app.post("/api/control/reset")
async def control_reset():
    controller.reset()
    return {"status": "ok", "reset": True}

@app.post("/api/control/speed")
async def control_speed(multiplier: float = Query(..., ge=0.2, le=20.0)):
    controller.set_speed(multiplier)
    return {"status": "ok", "speed": multiplier}

@app.post("/api/control/scenario")
async def control_scenario(scenario: str = Query(..., regex="^(normal_day|event_day)$")):
    controller.set_scenario(scenario)
    return {"status": "ok", "scenario": scenario}

@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    # Send initial geometry and state immediately
    if CACHED_GEOMETRY:
        await websocket.send_text(json.dumps({"type": "geometry", "data": CACHED_GEOMETRY}))
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                cmd = msg.get("action")
                if cmd == "start":
                    controller.start(msg.get("scenario", "normal_day"))
                elif cmd == "pause":
                    controller.pause()
                elif cmd == "resume":
                    controller.resume()
                elif cmd == "reset":
                    controller.reset()
                elif cmd == "set_speed":
                    controller.set_speed(msg.get("multiplier", 1.0))
                elif cmd == "set_scenario":
                    controller.set_scenario(msg.get("scenario", "normal_day"))
            except Exception as e:
                print(f"[WS Command Error]: {e}")
    except WebSocketDisconnect:
        active_connections.discard(websocket)
    except Exception:
        active_connections.discard(websocket)

# Mount UI static files
app.mount("/", StaticFiles(directory=str(UI_DIR), html=True), name="ui")
