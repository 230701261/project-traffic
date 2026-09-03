# SUMO + TraCI Traffic Simulation Digital Twin

An interactive **Smart City Traffic Digital Twin** for the **MA Chidambaram Stadium (Chepauk), Chennai** area, powered by **Eclipse SUMO**, controlled through **Python TraCI**, and visualized using a **3D web-based Digital Twin**.

The project simulates multimodal urban transportation under two scenarios:

* ☀️ **Normal Day** — regular city traffic and pedestrian activity
* 🏟️ **Event Day** — high traffic, stadium crowd surge, heavy pedestrian movement, railway passenger arrivals, and realistic congestion

The system is completely simulation-driven. **SUMO is the authoritative source of simulation state**, while TraCI provides the interface between SUMO and the Python controller. The 3D Digital Twin visualizes the actual simulation state.

---

# 🌟 Overview

The project represents a stadium-centered urban transportation network containing:

* 🛣️ Major 4-lane roads
* 🛣️ Minor 2-way roads
* 🚦 Signalized junctions
* 🚗 Cars
* 🏍️ Motorcycles
* 🚌 Buses
* 🚆 Elevated railway
* 🚉 One primary railway station near the stadium
* 🚶 Pedestrian corridors and sidewalks
* 🏟️ MA Chidambaram Stadium
* 🏪 Roadside shops and commercial buildings
* 🏖️ Marina Beach
* 🗿 Small coastal decorative statues
* 🚌 Roadside bus stops

The primary objective is to provide a **visual simulation environment**, not a conventional business analytics dashboard.

The user should be able to watch the transportation system operate in a virtual environment and observe the differences between Normal Day and Event Day.

---

# 🎯 Project Objectives

The main objectives are:

1. Build a microscopic multimodal traffic simulation using SUMO.
2. Control and monitor the simulation using TraCI.
3. Create a 3D Digital Twin that reflects actual SUMO state.
4. Simulate both normal and event-day traffic conditions.
5. Model cars, motorcycles, buses, trains, and pedestrians.
6. Model railway passengers travelling toward the stadium.
7. Simulate event-day traffic congestion and long queues.
8. Represent the stadium and surrounding urban environment.
9. Provide clear pedestrian access around the stadium and beach.
10. Demonstrate how traffic conditions change during a major event.

---

# 🗺️ Simulated Environment

The network is based on the provided reference map of the Chepauk/Stadium area.

The map contains the following major components.

## Road Network

### Major Roads

Major roads are represented as **4-lane bidirectional roads**:

```text
← ←
════════════════════
════════════════════
→ →
```

There are:

* 2 lanes in one direction
* 2 lanes in the opposite direction

Major corridors include the modeled north, south, east and west arterial roads.

### Minor Roads

Single-line roads in the reference map are represented as:

```text
←
══════════════
→
```

They contain:

* 1 lane in each direction
* 2-way traffic

The road network includes the central stadium approach and other mapped connectors.

---

# 🚆 Elevated Railway

The railway is a **dedicated elevated railway corridor**.

It is physically separated from the ground-level road network.

Conceptually:

```text
                 🚆
════════════════════════════
       ELEVATED RAILWAY
════════════════════════════
          │          │
          │          │
        Pillar     Pillar
          │          │
────────────────────────────
        GROUND LEVEL
────────────────────────────
        ROAD NETWORK
```

The railway is elevated approximately:

```text
SUMO elevation:      Z = 8 m
Three.js elevation:  Y = 8 m
```

There are:

* No railway-road level crossings
* No railway-road junctions
* No road vehicles on railway edges
* No trains on road edges
* No railway traffic lights

The train operates exclusively on the railway infrastructure.

---

# 🚉 Railway Station

The project uses **one primary railway station near the stadium**.

The station is located on the elevated railway.

Passenger access follows:

```text
🚆 TRAIN
   ↓
🚉 ELEVATED STATION
   ↓
STAIRS / LIFT
   ↓
GROUND-LEVEL PLAZA
   ↓
🚶 PEDESTRIAN NETWORK
   ↓
🏟️ STADIUM
```

This allows railway passengers to travel from the station to the stadium without crossing the railway tracks or interacting directly with road traffic.

---

# 🚶 Pedestrian Network

The project includes dedicated pedestrian infrastructure.

The pedestrian network contains:

* Sidewalks
* Stadium pedestrian routes
* Railway-station access
* Beach-side walking paths
* Road crossings
* Pedestrian plazas
* Bus-stop waiting areas

The main stadium pedestrian route is:

```text
🚉 Railway Station
       ↓
Station Access
       ↓
🚶 Ground-Level Walkway
       ↓
🚶🚶🚶 Pedestrian Corridor
       ↓
🏟️ Stadium
```

During Event Day, this corridor carries a substantially larger pedestrian flow.

---

# 🏖️ Marina Beach

Marina Beach is represented as a separate coastal environment.

The beach is intentionally kept away from the beach-side road.

The coastal layout follows:

```text
🏪 CITY / SHOPS
       ↓
🚶 SIDEWALK
────────────────────────
🚗 BEACH-SIDE ROAD
════════════════════════
🚗 BEACH-SIDE ROAD
────────────────────────
🚶 SIDEWALK
────────────────────────
🏖️ BEACH
~~~~~~~~~~~~~~~~~~~~~~~~
🌊 WATER
```

The beach does **not** directly touch the road.

A realistic sidewalk/curb/setback separates the road from the beach.

The beach-side pedestrian network is located along the sides of the road rather than being represented as one large isolated pedestrian zone.

The immediate beach environment uses limited decorative stone statues instead of dense trees/green landscaping.

---

# 🏪 Roadside Commercial Environment

The Digital Twin includes roadside shops and small commercial buildings to provide an urban environment around the transportation network.

Shops are positioned:

```text
🏪 🏪 🏪
│  │  │
SIDEWALK
────────────────
ROAD
════════════════
ROAD
────────────────
SIDEWALK
│
🏪 🏪
```

Shops must remain outside active traffic lanes.

Commercial buildings are concentrated around:

* Major roads
* Stadium approaches
* Bus stops
* Pedestrian areas
* Important junctions

The project avoids placing buildings directly on roads or blocking vehicle movement.

---

# 🚌 Bus Stops

Bus stops are represented as clearly visible yellow structures.

Conceptually:

```text
┌───────────────────┐
│     BUS STOP      │
│       🚌          │
└───────────────────┘
```

Bus stops are:

* Located beside roads
* Connected to valid SUMO bus-stop infrastructure
* Served by bus routes
* Connected to pedestrian waiting areas

Buses physically stop at the SUMO bus stops and then continue their routes.

The number and locations of bus stops are derived from the reference map.

---

# 🚗 Multimodal Simulation

The simulation supports multiple transportation modes.

| Mode              | Simulation               |
| ----------------- | ------------------------ |
| 🚗 Cars           | SUMO                     |
| 🏍️ Motorcycles   | SUMO                     |
| 🚌 Buses          | SUMO                     |
| 🚆 Trains         | SUMO                     |
| 🚶 Pedestrians    | SUMO                     |
| 🚦 Traffic lights | SUMO                     |
| 🏟️ Stadium       | Digital Twin landmark    |
| 🏖️ Beach         | Digital Twin landmark    |
| 🏪 Shops          | Digital Twin environment |

Moving entities are not independently animated by the frontend.

---

# ☀️ Normal Day Scenario

Normal Day represents regular city transportation activity.

Traffic is **not empty**, but it is significantly lighter than Event Day.

Typical behavior:

* Regular car flow
* Moderate motorcycle flow
* Scheduled buses
* Periodic trains
* Low-to-moderate pedestrian activity
* Some beach visitors
* Small stadium pedestrian demand
* Normal traffic-light queues
* Mostly free-flowing roads

Normal Day should feel like an ordinary operating day in an urban area.

---

# 🏟️ Event Day Scenario

Event Day simulates a major stadium event.

Traffic demand increases significantly.

The simulation produces:

* Very high car traffic
* High motorcycle traffic
* Increased bus traffic
* Increased train passenger demand
* Large pedestrian crowds
* Stadium-bound traffic
* Long vehicle queues
* Junction congestion
* Reduced speeds
* Increased waiting times

The congestion is generated by SUMO rather than by frontend animation.

---

# ⏱️ Event-Day Traffic Phases

Event Day demand is time-dependent.

## Phase 1 — Pre-Event

```text
0–300 seconds
```

Traffic begins building above the Normal Day baseline.

## Phase 2 — Arrival Surge

```text
300–900 seconds
```

Traffic increases significantly.

Expected:

* More cars
* More motorcycles
* More buses
* More stadium-bound vehicles
* More railway passengers
* More pedestrians

## Phase 3 — Peak Event

```text
900–1500 seconds
```

Maximum traffic and pedestrian demand.

Expected:

* Long traffic queues
* Congested junctions
* Low average speeds
* Heavy stadium approaches
* Large pedestrian crowds
* High bus activity

## Phase 4 — Egress

```text
1500 seconds+
```

Vehicles and pedestrians begin leaving the stadium.

Traffic disperses toward:

* North
* South
* East
* West

Congestion gradually changes and decreases.

---

# 🚆 Train Timetable

Trains operate periodically on the elevated railway.

Train behavior:

```text
Railway
   ↓
Approach Station
   ↓
Slow Down
   ↓
Stop
   ↓
Passenger Activity
   ↓
Dwell
   ↓
Depart
```

Train interval and station dwell time are configurable.

Example configuration:

```text
TRAIN_INTERVAL
DWELL_TIME
```

The exact timetable can be adjusted according to the simulation duration.

Trains are controlled by SUMO and monitored through TraCI.

---

# 🚶 Railway → Stadium Passenger Flow

One of the key Event Day behaviors is railway passenger movement.

```text
🚆
 ↓
🚉 Railway Station
 ↓
Stairs / Lift
 ↓
Ground Plaza
 ↓
🚶🚶🚶🚶
 ↓
Pedestrian Corridor
 ↓
🏟️ Stadium
```

Normal Day:

* Low stadium-bound railway pedestrian flow

Event Day:

* High stadium-bound railway pedestrian flow

Pedestrians are actual SUMO simulation entities.

---

# 🚦 Traffic Lights

Traffic lights are controlled by SUMO.

The Digital Twin receives signal state through TraCI.

Architecture:

```text
SUMO Traffic Light
        ↓
      TraCI
        ↓
      Python
        ↓
    WebSocket
        ↓
     Three.js
```

The frontend does not independently simulate traffic signal states.

---

# 🧠 System Architecture

The complete system follows:

```text
┌──────────────────────────────────────┐
│             Eclipse SUMO             │
│                                      │
│  Microscopic Traffic Simulation      │
│  Vehicles / Pedestrians / Trains     │
│  Buses / Traffic Lights / Routes     │
└──────────────────┬───────────────────┘
                   │
                   │ TraCI
                   ▼
┌──────────────────────────────────────┐
│       Python TraCI Controller        │
│                                      │
│ Scenario Manager                     │
│ Metrics Collector                    │
│ Traffic Light Manager                │
│ Network Exporter                     │
└──────────────────┬───────────────────┘
                   │
                   │ WebSocket / REST
                   ▼
┌──────────────────────────────────────┐
│          3D Digital Twin             │
│                                      │
│ Three.js Renderer                    │
│ Vehicles                             │
│ Pedestrians                          │
│ Buses                                │
│ Trains                               │
│ Roads                                │
│ Railway                              │
│ Stadium                              │
│ Shops                                │
│ Beach                                │
└──────────────────────────────────────┘
```

---

# 🔄 Data Flow

Every moving entity follows the same pipeline:

```text
SUMO
 ↓
TraCI
 ↓
Python
 ↓
WebSocket
 ↓
Three.js
 ↓
3D Digital Twin
```

For example:

```text
SUMO Vehicle Position
        ↓
TraCI vehicle.getPosition()
        ↓
Python controller
        ↓
WebSocket message
        ↓
Three.js
        ↓
3D vehicle position
```

The same approach is used for:

* Cars
* Motorcycles
* Buses
* Trains
* Pedestrians
* Traffic lights

---

# 🚫 No Live Data

This project does not depend on external live traffic sources.

The following are NOT used:

* Google Maps traffic
* GPS feeds
* CCTV
* IoT sensors
* Real-time vehicle feeds
* External pedestrian feeds
* External traffic APIs
* Live railway feeds

The simulation is self-contained.

The authoritative runtime data source is:

**SUMO → TraCI**

---

# 🖥️ Digital Twin Interface

The application is simulation-first.

The main screen is dominated by the 3D environment.

The UI provides lightweight overlays for:

* Scenario selection
* Play/Pause
* Reset
* Simulation speed
* Simulation time
* Vehicle count
* Pedestrian count
* Bus count
* Train count
* Average speed
* Queue length
* Congestion
* Camera controls

The UI should not obscure the simulation environment.

---

# 🎥 Camera Controls

The Digital Twin supports:

* Zoom
* Pan
* Rotate
* Overview camera
* Stadium camera
* Railway camera
* Station camera
* Beach camera
* Junction camera
* Vehicle following
* Pedestrian following
* Train following

---

# 📊 Simulation Metrics

The backend can calculate and expose metrics such as:

* Total vehicles
* Active vehicles
* Active pedestrians
* Active buses
* Active trains
* Average speed
* Waiting time
* Queue length
* Congestion
* Stadium arrivals
* Railway arrivals
* Scenario phase

These metrics are derived from the SUMO simulation through TraCI.

---

# 📂 Project Structure

```text
project Traffic/
│
├── sumo/
│   ├── network.nod.xml
│   ├── network.edg.xml
│   ├── network.con.xml
│   ├── network.typ.xml
│   ├── network.net.xml
│   │
│   ├── additional.add.xml
│   ├── normal_day.rou.xml
│   ├── event_day.rou.xml
│   │
│   ├── normal_day.sumocfg
│   └── event_day.sumocfg
│
├── python/
│   ├── __init__.py
│   ├── config.py
│   ├── main.py
│   ├── server.py
│   ├── traci_controller.py
│   ├── scenario_manager.py
│   ├── network_exporter.py
│   ├── traffic_light_manager.py
│   └── metrics_collector.py
│
├── ui/
│   ├── index.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── renderer3d.js
│       ├── app.js
│       ├── controls.js
│       └── dashboard.js
│
├── README.md
└── requirements.txt
```

---

# 📄 Important Files

## `sumo/network.nod.xml`

Contains SUMO node definitions including:

* Road junctions
* Railway nodes
* Stadium-related nodes
* Pedestrian infrastructure

## `sumo/network.edg.xml`

Contains:

* Road edges
* Lane definitions
* Railway edges
* Pedestrian edges where applicable

## `sumo/network.con.xml`

Contains:

* Road connections
* Turning movements
* Lane connections
* Pedestrian crossings where applicable

## `sumo/network.typ.xml`

Defines network types including:

* Major roads
* Minor roads
* Railway
* Pedestrian infrastructure

## `sumo/network.net.xml`

Compiled SUMO network generated from the source network files.

## `sumo/additional.add.xml`

Contains additional SUMO infrastructure such as:

* Bus stops
* Railway stops
* Traffic-light-related infrastructure
* Other simulation additions

## `sumo/normal_day.rou.xml`

Contains Normal Day:

* Vehicle flows
* Motorcycle flows
* Bus routes
* Train routes
* Pedestrian demand

## `sumo/event_day.rou.xml`

Contains Event Day:

* High vehicle demand
* Stadium arrival flows
* Bus demand
* Train demand
* Pedestrian demand

---

# 🐍 Python Components

## `python/main.py`

Main application entry point.

Starts the backend and Digital Twin server.

Run:

```powershell
python -m python.main
```

## `python/traci_controller.py`

Responsible for:

* Starting SUMO
* Connecting to TraCI
* Running simulation steps
* Reading simulation state
* Sending state to the frontend

## `python/scenario_manager.py`

Responsible for:

* Normal Day
* Event Day
* Time-dependent demand
* Event arrival phase
* Event peak
* Event departure
* Pedestrian crowd generation

## `python/network_exporter.py`

Exports static network information to the Digital Twin:

* Roads
* Junctions
* Railway
* Bus stops
* Pedestrian paths
* Stadium
* Beach
* Other landmarks

## `python/traffic_light_manager.py`

Handles traffic-light state monitoring and related simulation logic.

## `python/metrics_collector.py`

Collects:

* Speed
* Waiting time
* Queue length
* Vehicle counts
* Pedestrian counts
* Congestion
* Other simulation metrics

## `python/server.py`

Provides:

* HTTP server
* REST endpoints
* WebSocket simulation stream

---

# 🌐 Frontend

## `ui/index.html`

Defines the Digital Twin interface.

## `ui/css/style.css`

Controls:

* Dark visual theme
* HUD
* Controls
* Simulation overlays
* Layout

## `ui/js/renderer3d.js`

Responsible for rendering:

* Roads
* Vehicles
* Motorcycles
* Buses
* Railway
* Trains
* Pedestrians
* Stadium
* Shops
* Bus stops
* Beach
* Pedestrian paths
* Environmental elements

## `ui/js/app.js`

Coordinates:

* WebSocket communication
* Simulation state
* Rendering updates

## `ui/js/controls.js`

Controls:

* Play
* Pause
* Reset
* Speed
* Scenario
* Camera

## `ui/js/dashboard.js`

Handles optional simulation metrics and lightweight HUD elements.

---

# ⚙️ Requirements

Recommended environment:

* Python 3.10+
* Eclipse SUMO
* Windows / Linux
* Modern web browser
* Node.js is not required unless the frontend build system specifically uses it

Python packages include:

```text
traci
sumolib
fastapi
uvicorn
websockets
requests
```

Install Python dependencies:

```powershell
pip install -r requirements.txt
```

---

# 🔧 SUMO Installation

Install Eclipse SUMO and configure the `SUMO_HOME` environment variable.

Verify SUMO:

```powershell
sumo --version
```

Verify TraCI:

```powershell
python -c "import traci; print('TraCI OK')"
```

Verify SUMO tools:

```powershell
netconvert --version
```

---

# 🚀 Running the Project

From the project root:

```powershell
python -m python.main
```

The server should start at:

```text
http://127.0.0.1:8000
```

Open the address in a browser if it does not open automatically.

---

# ▶️ Running Normal Day

The application should allow selecting:

```text
NORMAL DAY
```

The expected result is:

* Regular traffic
* Moderate motorcycles
* Scheduled buses
* Periodic trains
* Moderate/low pedestrians
* Low stadium activity
* Beach activity
* Normal junction queues

---

# 🏟️ Running Event Day

Select:

```text
EVENT DAY
```

The simulation should progress through:

```text
PRE-EVENT
     ↓
ARRIVAL SURGE
     ↓
PEAK EVENT
     ↓
DEPARTURE
```

During peak event conditions, the user should observe:

* Large vehicle volumes
* Long queues
* Congested junctions
* Slower vehicles
* Large pedestrian crowds
* Railway passenger arrivals
* Stadium-bound pedestrians
* Increased bus activity

---

# 🧪 Validation

Before considering the project complete, validate the SUMO network.

## Compile Network

```powershell
netconvert
```

or use the project's configured network-generation command.

Verify:

* No network errors
* No invalid edges
* No broken connections
* No invalid routes

---

# 🧪 Normal Day Test

Run the complete Normal Day simulation.

Verify:

* Cars continuously appear
* Motorcycles appear
* Buses operate
* Trains operate periodically
* Pedestrians move
* Traffic lights operate
* Stadium access works
* Beach access works
* No road/railway collision
* No major gridlock

---

# 🧪 Event Day Test

Run at least:

```text
1800 seconds
```

to cover the complete event cycle.

Verify:

### 0–300s

Pre-event traffic buildup.

### 300–900s

Arrival surge.

### 900–1500s

Peak congestion.

### 1500s+

Departure/dispersal.

Verify:

* Long queues
* High vehicle count
* High waiting time
* Reduced average speed
* High pedestrian count
* Strong railway → stadium flow
* Increased bus demand
* Stadium congestion

---

# 🚦 Railway Safety Validation

The railway must always satisfy:

```text
RAILWAY
===========
Z = 8m
===========

        ↓

GROUND ROAD
===========
Z = 0m
===========
```

There must be:

* No level crossings
* No railway-road junctions
* No train-road interaction
* No vehicle on railway edges
* No railway traffic lights

---

# 🏖️ Beach Validation

Verify:

* Beach does not touch road
* Beach does not overlap road
* Beach has a visible setback
* Beach-side road remains a normal vehicle road
* Pedestrian sidewalks exist on both sides
* Beach remains accessible to pedestrians
* Beach environment remains visually open
* Dense trees are not used along the immediate beach zone
* Decorative stone statues do not block pedestrian movement

---

# 🏟️ Stadium Validation

Verify:

* Stadium does not touch active road lanes
* Stadium has a small setback/buffer
* Stadium remains close to the transportation network
* Stadium pedestrian entrance is accessible
* Railway station connects to stadium
* Event traffic can reach stadium
* Event pedestrians can reach stadium

---

# 🏪 Shop Validation

Verify:

* Shops are beside roads
* Shops do not occupy traffic lanes
* Shops do not block junctions
* Shops do not block bus stops
* Shops do not block pedestrian paths
* Shops have realistic spacing
* Shops improve the urban environment

---

# 🚶 Pedestrian Validation

Verify:

* Pedestrians use valid SUMO paths
* Pedestrians do not teleport
* Pedestrians do not walk on railway tracks
* Pedestrians do not randomly walk through vehicles
* Pedestrians can reach the stadium
* Pedestrians can reach the beach
* Event Day produces substantially higher pedestrian demand

---

# 🔒 Simulation Integrity

The following principle is mandatory:

> **If it moves, SUMO simulates it. If it is visualized, Three.js displays the SUMO state.**

Do not create independent frontend simulations.

The following must originate from SUMO:

* Vehicle movement
* Motorcycle movement
* Bus movement
* Train movement
* Pedestrian movement
* Traffic lights
* Vehicle queues
* Congestion
* Waiting time
* Simulation time

---

# 🚫 Prohibited Approaches

The project must NOT use:

* Fake vehicle animation
* Fake pedestrian animation
* Fake train animation
* Fake congestion
* Fake traffic-light states
* Random frontend vehicle spawning
* Google Maps traffic
* GPS traffic
* CCTV feeds
* IoT feeds
* External live traffic APIs
* Real-world live vehicle data

---

# 🏗️ Design Philosophy

The Digital Twin should prioritize:

```text
SIMULATION
    ↓
VISUALIZATION
    ↓
INTERACTION
```

rather than:

```text
DASHBOARD
    ↓
CHARTS
    ↓
SIMULATION
```

The primary purpose is to **watch and interact with the traffic simulation**.

Analytics and KPIs are secondary.

---

# 🎯 Final Expected Experience

When the project is running, the user should feel as if they are observing a virtual transportation system around Chepauk Stadium.

The environment should contain:

```text
                🚆
        ═══════════════════
         ELEVATED RAILWAY
        ═══════════════════
                🚉
             STATION
                │
             🚶🚶🚶
                │
         PEDESTRIAN PATH
                │
                ▼
             🏟️ STADIUM

🏪      🚦      🏪
════════════════════════
🚗 🚗 🚗 🚗 🚗 🚗 🚗
════════════════════════
🏪      🚌      🏪

────────────────────────
🚶 SIDEWALK
────────────────────────
🏖️ BEACH
~~~~~~~~~~~~~~~~~~~~~~~~
🌊🌊🌊🌊🌊🌊🌊
```

On Normal Day, the environment should show **regular, flowing traffic**.

On Event Day, the same network should transform into a **high-density stadium transportation scenario** with:

* Heavy traffic
* Long queues
* Congested junctions
* Large pedestrian crowds
* Busy buses
* Railway arrivals
* Strong station-to-stadium pedestrian flow
* Stadium activity
* Post-event dispersal

---

# 📌 Core Architecture Summary

```text
                    ┌──────────────┐
                    │     SUMO     │
                    │              │
                    │  Simulation  │
                    └──────┬───────┘
                           │
                         TraCI
                           │
                           ▼
                    ┌──────────────┐
                    │    Python    │
                    │              │
                    │ Controller   │
                    │ Scenarios    │
                    │ Metrics      │
                    └──────┬───────┘
                           │
                    WebSocket / REST
                           │
                           ▼
                    ┌──────────────┐
                    │   Three.js   │
                    │              │
                    │ 3D Digital   │
                    │    Twin      │
                    └──────────────┘
```

**SUMO is the simulation engine.**

**TraCI is the simulation communication interface.**

**Python is the controller and data bridge.**

**Three.js is the visualization layer.**

The final project is therefore a genuine **SUMO + TraCI + Python + 3D Digital Twin traffic simulation**, with Normal Day and Event Day scenarios and no dependency on live traffic data.
