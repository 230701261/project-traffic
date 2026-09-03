from collections import deque
import numpy as np

class MetricsCollector:
    def __init__(self, max_history=120):
        self.max_history = max_history
        self.reset()
        
        # Scenario historical aggregates for comparison panel
        self.scenario_stats = {
            "normal_day": {
                "avg_speed_kmh": 36.4,
                "avg_waiting_time_s": 6.8,
                "max_queue_len_m": 24.5,
                "congestion_level_pct": 14.2,
                "peak_active_vehicles": 42,
                "peak_active_pedestrians": 28,
                "total_stadium_visitors": 18,
                "total_railway_arrivals": 35
            },
            "event_day": {
                "avg_speed_kmh": 14.8,
                "avg_waiting_time_s": 38.5,
                "max_queue_len_m": 185.0,
                "congestion_level_pct": 74.6,
                "peak_active_vehicles": 138,
                "peak_active_pedestrians": 245,
                "total_stadium_visitors": 420,
                "total_railway_arrivals": 310
            }
        }

    def reset(self):
        self.history_time = deque(maxlen=self.max_history)
        self.history_speed = deque(maxlen=self.max_history)
        self.history_waiting = deque(maxlen=self.max_history)
        self.history_vehicles = deque(maxlen=self.max_history)
        self.history_pedestrians = deque(maxlen=self.max_history)
        self.history_congestion = deque(maxlen=self.max_history)
        
        self.cumulative_stadium_visitors = 0
        self.cumulative_railway_arrivals = 0
        self.stadium_pedestrian_ids = set()
        self.railway_pedestrian_ids = set()
        
        self.live_kpis = {
            "time_s": 0.0,
            "active_vehicles": 0,
            "active_pedestrians": 0,
            "active_buses": 0,
            "avg_speed_kmh": 0.0,
            "avg_waiting_time_s": 0.0,
            "total_queue_length_m": 0.0,
            "overall_congestion_pct": 0.0,
            "stadium_visitors_total": 0,
            "railway_arrivals_total": 0
        }

    def update(self, sim_time, vehicles, pedestrians, edges_congestion, current_scenario):
        veh_count = len(vehicles)
        ped_count = len(pedestrians)
        bus_count = sum(1 for v in vehicles if v.get("type") == "bus")

        speeds = [v["speed"] * 3.6 for v in vehicles] if vehicles else [40.0]
        avg_speed = float(np.mean(speeds)) if speeds else 40.0

        wait_times = [v["waiting_time"] for v in vehicles] if vehicles else [0.0]
        avg_waiting = float(np.mean(wait_times)) if wait_times else 0.0

        total_queue = sum(e["queue_len"] for e in edges_congestion.values())
        
        # Calculate overall network congestion percentage
        if edges_congestion:
            cong_values = [e["occupancy"] * 100 for e in edges_congestion.values()]
            overall_congestion = float(np.mean(cong_values))
        else:
            overall_congestion = 0.0

        # Track pedestrians reaching stadium perimeter
        for p in pedestrians:
            p_id = p["id"]
            p_edge = p.get("edge_id", "")
            if "STAD" in p_edge:
                if p_id not in self.stadium_pedestrian_ids:
                    self.stadium_pedestrian_ids.add(p_id)
                    self.cumulative_stadium_visitors += 1
            if "STATION" in p_edge or "RS_" in p_edge:
                if p_id not in self.railway_pedestrian_ids:
                    self.railway_pedestrian_ids.add(p_id)
                    self.cumulative_railway_arrivals += 1

        self.live_kpis = {
            "time_s": round(sim_time, 1),
            "active_vehicles": veh_count,
            "active_pedestrians": ped_count,
            "active_buses": bus_count,
            "avg_speed_kmh": round(avg_speed, 1),
            "avg_waiting_time_s": round(avg_waiting, 1),
            "total_queue_length_m": round(total_queue, 1),
            "overall_congestion_pct": round(min(100.0, overall_congestion), 1),
            "stadium_visitors_total": self.cumulative_stadium_visitors,
            "railway_arrivals_total": self.cumulative_railway_arrivals
        }

        # Update historical rolling windows for live charts
        self.history_time.append(round(sim_time, 1))
        self.history_speed.append(round(avg_speed, 1))
        self.history_waiting.append(round(avg_waiting, 1))
        self.history_vehicles.append(veh_count)
        self.history_pedestrians.append(ped_count)
        self.history_congestion.append(round(overall_congestion, 1))

        # Dynamically record live scenario aggregate
        sc_data = self.scenario_stats[current_scenario]
        sc_data["avg_speed_kmh"] = round(avg_speed, 1)
        sc_data["avg_waiting_time_s"] = round(avg_waiting, 1)
        sc_data["max_queue_len_m"] = max(sc_data["max_queue_len_m"], round(total_queue, 1))
        sc_data["congestion_level_pct"] = round(overall_congestion, 1)
        sc_data["peak_active_vehicles"] = max(sc_data["peak_active_vehicles"], veh_count)
        sc_data["peak_active_pedestrians"] = max(sc_data["peak_active_pedestrians"], ped_count)
        sc_data["total_stadium_visitors"] = self.cumulative_stadium_visitors
        sc_data["total_railway_arrivals"] = self.cumulative_railway_arrivals

    def get_chart_data(self):
        return {
            "timestamps": list(self.history_time),
            "speed": list(self.history_speed),
            "waiting": list(self.history_waiting),
            "vehicles": list(self.history_vehicles),
            "pedestrians": list(self.history_pedestrians),
            "congestion": list(self.history_congestion)
        }

    def get_comparison(self):
        return self.scenario_stats
