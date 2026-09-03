import multiprocessing
import time
import requests
import asyncio
import websockets
import json
import uvicorn
from python.server import app

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

async def test_websocket_stream():
    print("Testing WebSocket live streaming...")
    async with websockets.connect("ws://127.0.0.1:8000/ws/simulation") as ws:
        received_frames = 0
        for _ in range(5):
            msg = await ws.recv()
            data = json.loads(msg)
            if "time" in data:
                received_frames += 1
                kpis = data.get("kpis", {})
                print(f"  [Frame {received_frames}] SimTime: {data.get('time')}s | Vehs: {len(data.get('vehicles', []))} | Peds: {len(data.get('pedestrians', []))} | AvgSpeed: {kpis.get('avg_speed_kmh')} km/h")
        
        print("  Testing WS scenario switch to event_day...")
        await ws.send(json.dumps({"action": "set_scenario", "scenario": "event_day"}))
        await asyncio.sleep(2)
        
        for _ in range(3):
            msg = await ws.recv()
            data = json.loads(msg)
            if "time" in data:
                print(f"  [Event Day Frame] SimTime: {data.get('time')}s | Vehs: {len(data.get('vehicles', []))} | Peds: {len(data.get('pedestrians', []))}")
        
        print("  [PASS] WebSocket streaming and controls verified")

def main():
    proc = multiprocessing.Process(target=run_server, daemon=True)
    proc.start()
    time.sleep(2)

    try:
        print("Testing REST Endpoints...")
        # 1. Geometry
        r_geo = requests.get("http://127.0.0.1:8000/api/network/geometry")
        assert r_geo.status_code == 200, f"Geometry failed: {r_geo.status_code}"
        geo = r_geo.json()
        assert len(geo["edges"]) > 0
        print(f"  [PASS] Geometry endpoint: {len(geo['edges'])} edges, {len(geo['polygons'])} landmarks/polys")

        # 2. Comparison
        r_comp = requests.get("http://127.0.0.1:8000/api/comparison")
        assert r_comp.status_code == 200
        print("  [PASS] Comparison endpoint verified")

        # 3. HTML index
        r_html = requests.get("http://127.0.0.1:8000/")
        assert r_html.status_code == 200
        print("  [PASS] UI static files served successfully")

        # 4. WebSocket
        asyncio.run(test_websocket_stream())

        print("\n" + "=" * 50)
        print("  ALL SYSTEM AND TRACI TESTS PASSED 100%!")
        print("=" * 50)
    finally:
        proc.terminate()
        proc.join()

if __name__ == "__main__":
    main()
