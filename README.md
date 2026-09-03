# SUMO + TraCI Traffic Simulation with Interactive Digital Twin UI

An interactive **Smart City Traffic Digital Twin** centered around **MA Chidambaram Stadium (Chepauk, Chennai)**, powered entirely by **Eclipse SUMO** and controlled via **Python TraCI**.

---

## 🌟 Overview & Features

- **Accurate Map Representation**: Built strictly from the uploaded Chepauk road network map, featuring **Wallajah Road (4-lane major arterial)**, **Kamarajar Salai (4-lane coastal arterial)**, **Pycrofts Road (4-lane major)**, **Bells Road**, **Quaid-E-Millath Road**, **Chepauk MRTS Railway**, and **Marina Beach**.
- **100% Simulation-Driven**:
  - No fake animations or static mockups.
  - Every single car, motorcycle, bus, train, and pedestrian position, heading, speed, waiting time, and signal phase is queried step-by-step in real-time from **Eclipse SUMO via TraCI**.
- **Multi-Modal Traffic**:
  - 🚗 **Cars & Taxis**: Realistic acceleration, deceleration, lane selection, and drop-off loops.
  - 🏍️ **Motorcycles**: High-density 2-wheelers with realistic gap dynamics.
  - 🚌 **MTC Buses**: Scheduled arrivals, designated bus stops, and Event Special Shuttles.
  - 🚆 **MRTS Rail**: Dedicated train tracks running to Chepauk Station.
  - 🚶 **Pedestrians**: Multi-directional pedestrian flows with striping model, sidewalks, and signalized crossings.
- **Dynamic Scenarios**:
  - ☀️ **Normal Day**: Low vehicle occupancy, dispersed pedestrian movement to beach and shops, free-flowing corridors (~38 km/h).
  - 🏟️ **Event Day (Match Surge)**: Massive crowd surges arriving by MRTS train stepping off Chepauk platform and walking across the pedestrian bridge into Stadium East Gate; heavy car/bike ingress on Bells Rd and Wallajah Rd causing realistic bottleneck congestion (~14 km/h, queues, high waiting times).
- **Digital Twin Dashboard**:
  - High-performance HTML5 Canvas vector map with smooth zoom, pan, and presets.
  - Real-time KPI summary cards (Vehicles, Pedestrians, Buses, Speed, Congestion %, Waiting Time, Queue Length, Stadium Ingress, Rail Arrivals).
  - Live Chart.js trends (Speed vs Congestion, Vehicle vs Pedestrian volume).
  - Normal vs Event Day comparative analysis matrix.
  - Interactive Inspector: Hover/click any vehicle or pedestrian to see live TraCI telemetry.
  - Layer toggles & speed controls (1x, 2x, 5x, 10x).

---

## 🏗️ Architecture

```
┌──────────────────────────────────────┐
│             Eclipse SUMO             │
│   Microscopic Multi-Modal Simulator  │
└──────────────────┬───────────────────┘
                   │
                 TraCI (TCP Protocol)
                   │
                   ▼
┌──────────────────────────────────────┐
│       Python TraCI Controller        │
│   (Scenario Manager, Metrics, TLS)   │
└──────────────────┬───────────────────┘
                   │
        WebSockets & REST API
                   │
                   ▼
┌──────────────────────────────────────┐
│       Digital Twin Web UI            │
│  (Canvas Renderer, Live KPIs, Charts)│
└──────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.10+
- Eclipse SUMO (with `SUMO_HOME` environment variable set)
- Python packages: `traci`, `sumolib`, `fastapi`, `uvicorn`, `websockets`, `requests`

### 2. Launch the Application
Run the main launcher:

```powershell
python python/main.py
```

This will:
1. Initialize the SUMO network and TraCI simulation controller.
2. Start the FastAPI + WebSocket backend on `http://127.0.0.1:8000`.
3. Automatically open the interactive Digital Twin dashboard in your default browser!

---

## 📂 Project Structure

```
project Traffic/
├── sumo/
│   ├── network.nod.xml          # Node definitions (intersections, stadium gates, station, beach)
│   ├── network.edg.xml          # Road & rail edge geometry (Wallajah, Kamarajar, Pycrofts, etc.)
│   ├── network.typ.xml          # Road type definitions & lane speeds
│   ├── network.con.xml          # Connections, lane turnings, pedestrian crossings
│   ├── network.net.xml          # Compiled SUMO network binary
│   ├── additional.add.xml       # Bus stops, train platforms, landmark 2D polygons
│   ├── normal_day.rou.xml       # Normal Day low-demand vehicular and pedestrian routes
│   ├── event_day.rou.xml        # Event Day surge routes, drop-offs, and train crowd flows
│   ├── normal_day.sumocfg       # Normal Day SUMO configuration
│   └── event_day.sumocfg        # Event Day SUMO configuration
│
├── python/
│   ├── __init__.py
│   ├── config.py                # File paths and simulation constants
│   ├── network_exporter.py      # Extracts static vector geometry for crisp canvas rendering
│   ├── traci_controller.py      # TraCI loop, step-by-step state extractor, playback manager
│   ├── scenario_manager.py      # Handles Normal vs Event Day and dynamic train crowd bursts
│   ├── traffic_light_manager.py # Adaptive signal monitoring and phase adjustments
│   ├── metrics_collector.py     # Aggregates live KPIs, queue lengths, speeds, and comparisons
│   ├── server.py                # FastAPI web server and WebSocket stream broadcaster
│   └── main.py                  # Main entry point (launches server and browser)
│
├── ui/
│   ├── index.html               # Digital Twin Command Center UI layout
│   ├── css/
│   │   └── style.css            # Dark smart city styling, glows, animations
│   └── js/
│       ├── renderer.js          # HTML5 Canvas vector renderer for roads, vehicles, pedestrians
│       ├── dashboard.js         # KPI cards, live Chart.js graphs, signal monitors
│       ├── controls.js          # Play/pause/reset/speed/scenario controls
│       └── app.js               # WebSocket client & 60 FPS animation coordinator
│
└── README.md
```
