import os
import sys
import time
import threading
import traci
from typing import Dict, Any, Optional

from .config import NORMAL_CFG, EVENT_CFG, SIM_STEP_LENGTH
from .traffic_light_manager import TrafficLightManager
from .scenario_manager import ScenarioManager
from .metrics_collector import MetricsCollector

class TraCIController:
    def __init__(self):
        self.lock = threading.Lock()
        self.running = False
        self.paused = False
        self.speed_multiplier = 1.0
        self.current_scenario = "normal_day"
        self.sim_time = 0.0
        
        self.traffic_lights = TrafficLightManager()
        self.scenario_mgr = ScenarioManager()
        self.metrics = MetricsCollector()
        
        self.thread: Optional[threading.Thread] = None
        self.latest_state: Dict[str, Any] = {}
        self.edge_speed_limits = {}

    def start(self, scenario: str = "normal_day"):
        with self.lock:
            if self.running:
                self._stop_sumo()
            
            self.current_scenario = scenario
            self.scenario_mgr.set_scenario(scenario)
            self.metrics.reset()
            self.paused = False
            
            cfg_file = EVENT_CFG if scenario == "event_day" else NORMAL_CFG
            sumo_cmd = [
                "sumo",
                "-c", cfg_file,
                "--step-length", str(SIM_STEP_LENGTH),
                "--no-step-log", "true",
                "--no-warnings", "true"
            ]
            
            try:
                traci.start(sumo_cmd)
                self.traffic_lights.initialize()
                self.running = True
                self._cache_edge_speed_limits()
            except Exception as ex:
                print(f"[TraCI Error] Failed to start SUMO: {ex}")
                self.running = False
                return False

        if self.thread is None or not self.thread.is_alive():
            self.thread = threading.Thread(target=self._simulation_loop, daemon=True)
            self.thread.start()
        
        return True

    def _cache_edge_speed_limits(self):
        self.edge_speed_limits = {}
        try:
            for edge_id in traci.edge.getIDList():
                try:
                    lane_0 = f"{edge_id}_0"
                    self.edge_speed_limits[edge_id] = traci.lane.getMaxSpeed(lane_0)
                except Exception:
                    self.edge_speed_limits[edge_id] = 13.89
        except Exception:
            pass

    def pause(self):
        with self.lock:
            self.paused = True

    def resume(self):
        with self.lock:
            self.paused = False

    def reset(self):
        self.start(self.current_scenario)

    def set_speed(self, multiplier: float):
        with self.lock:
            self.speed_multiplier = max(0.2, min(20.0, float(multiplier)))

    def set_scenario(self, scenario: str):
        if scenario in ["normal_day", "event_day"]:
            self.start(scenario)

    def _simulation_loop(self):
        while self.running:
            start_loop = time.time()
            
            if not self.paused:
                with self.lock:
                    try:
                        traci.simulationStep()
                        self.sim_time = traci.simulation.getTime()
                        self.scenario_mgr.step(self.sim_time)
                        
                        # Extract full simulation state
                        snapshot = self._extract_snapshot()
                        self.latest_state = snapshot
                    except traci.exceptions.FatalTraCIError:
                        print("[TraCI] Simulation ended or stopped.")
                        self.running = False
                        break
                    except Exception as ex:
                        print(f"[TraCI Step Error]: {ex}")

            # Sleep to match target speed
            step_duration = (SIM_STEP_LENGTH / self.speed_multiplier)
            elapsed = time.time() - start_loop
            sleep_time = max(0.005, step_duration - elapsed)
            time.sleep(sleep_time)

    def _extract_snapshot(self) -> Dict[str, Any]:
        sim_time = self.sim_time
        
        # 1. Vehicles
        vehicles = []
        try:
            veh_ids = traci.vehicle.getIDList()
            for v_id in veh_ids:
                try:
                    pos = traci.vehicle.getPosition(v_id)
                    angle = traci.vehicle.getAngle(v_id)
                    speed = traci.vehicle.getSpeed(v_id)
                    v_type = traci.vehicle.getTypeID(v_id)
                    lane_id = traci.vehicle.getLaneID(v_id)
                    road_id = traci.vehicle.getRoadID(v_id)
                    waiting_time = traci.vehicle.getWaitingTime(v_id)
                    length = traci.vehicle.getLength(v_id)
                    width = traci.vehicle.getWidth(v_id)
                    
                    # Normalize category
                    cat = "car"
                    if "bike" in v_type or "motorcycle" in v_type:
                        cat = "motorcycle"
                    elif "bus" in v_type:
                        cat = "bus"
                    elif "emergency" in v_type:
                        cat = "emergency"
                    elif "train" in v_type:
                        cat = "train"
                    elif "taxi" in v_type:
                        cat = "taxi"

                    vehicles.append({
                        "id": v_id,
                        "type": cat,
                        "vType": v_type,
                        "x": round(pos[0], 2),
                        "y": round(pos[1], 2),
                        "angle": round(angle, 1),
                        "speed": round(speed, 2),
                        "speed_kmh": round(speed * 3.6, 1),
                        "lane_id": lane_id,
                        "road_id": road_id,
                        "waiting_time": round(waiting_time, 1),
                        "length": round(length, 1),
                        "width": round(width, 1)
                    })
                except Exception:
                    continue
        except Exception:
            pass

        # 2. Pedestrians (Persons)
        pedestrians = []
        try:
            person_ids = traci.person.getIDList()
            for p_id in person_ids:
                try:
                    pos = traci.person.getPosition(p_id)
                    angle = traci.person.getAngle(p_id)
                    speed = traci.person.getSpeed(p_id)
                    p_type = traci.person.getTypeID(p_id)
                    road_id = traci.person.getRoadID(p_id)
                    
                    # Classify destination flow
                    dest_flow = "local"
                    if "stadium" in p_id or "stad" in p_type:
                        dest_flow = "stadium"
                    elif "beach" in p_id or "beach" in p_type:
                        dest_flow = "beach"

                    pedestrians.append({
                        "id": p_id,
                        "type": p_type,
                        "dest_flow": dest_flow,
                        "x": round(pos[0], 2),
                        "y": round(pos[1], 2),
                        "angle": round(angle, 1),
                        "speed": round(speed, 2),
                        "edge_id": road_id
                    })
                except Exception:
                    continue
        except Exception:
            pass

        # 3. Traffic Lights
        tls_states = self.traffic_lights.get_all_states()

        # 4. Road Edge Congestion Levels
        edges_congestion = {}
        try:
            for edge_id in traci.edge.getIDList():
                if edge_id.startswith(":"):
                    continue
                try:
                    mean_speed = traci.edge.getLastStepMeanSpeed(edge_id)
                    occupancy = traci.edge.getLastStepOccupancy(edge_id)
                    halting = traci.edge.getLastStepHaltingNumber(edge_id)
                    max_speed = self.edge_speed_limits.get(edge_id, 13.89)
                    
                    speed_ratio = mean_speed / max_speed if max_speed > 0 else 1.0
                    queue_m = halting * 6.5
                    
                    # Congestion classification
                    if occupancy > 0.40 or (halting >= 3 and speed_ratio < 0.3):
                        level = "red"
                    elif occupancy > 0.15 or speed_ratio < 0.6:
                        level = "yellow"
                    else:
                        level = "green"

                    edges_congestion[edge_id] = {
                        "speed_ratio": round(speed_ratio, 2),
                        "occupancy": round(occupancy, 2),
                        "queue_len": round(queue_m, 1),
                        "level": level
                    }
                except Exception:
                    continue
        except Exception:
            pass

        # 5. Bus Stops
        bus_stops = []
        try:
            for bs_id in traci.busstop.getIDList():
                try:
                    p_count = traci.busstop.getPersonCount(bs_id)
                    veh_ids = traci.busstop.getVehicleIDs(bs_id)
                    bus_stops.append({
                        "id": bs_id,
                        "waiting": p_count,
                        "active_buses": list(veh_ids)
                    })
                except Exception:
                    continue
        except Exception:
            pass

        # 6. Update KPIs in Metrics Collector
        self.metrics.update(sim_time, vehicles, pedestrians, edges_congestion, self.current_scenario)

        return {
            "time": round(sim_time, 1),
            "scenario": self.current_scenario,
            "event_phase": self.scenario_mgr.get_event_phase(sim_time),
            "paused": self.paused,
            "speed_multiplier": self.speed_multiplier,
            "vehicles": vehicles,
            "pedestrians": pedestrians,
            "traffic_lights": tls_states,
            "edges_congestion": edges_congestion,
            "bus_stops": bus_stops,
            "kpis": self.metrics.live_kpis,
            "chart_data": self.metrics.get_chart_data()
        }

    def _stop_sumo(self):
        try:
            traci.close()
        except Exception:
            pass
        self.running = False

    def close(self):
        with self.lock:
            self._stop_sumo()
