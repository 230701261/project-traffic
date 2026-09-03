/**
 * Full-Screen 3D Traffic Digital Twin Coordinator
 * Connects WebSocket to Python TraCI server and feeds state into 3D WebGL renderer.
 */

class TrafficDigitalTwinApp {
    constructor() {
        this.renderer3d = new SimulationRenderer3D('threeContainer');
        this.controls = new ControlsManager(this);

        this.ws = null;
        this.latestState = null;
        this.isPaused = false;
        this.currentScenario = 'normal_day';

        this.init();
    }

    async init() {
        // 1. Fetch static vector network geometry
        try {
            const resp = await fetch('/api/network/geometry');
            if (resp.ok) {
                const geoData = await resp.json();
                this.renderer3d.setGeometry(geoData);
            }
        } catch (e) {
            console.warn('Failed to pre-fetch network geometry via REST:', e);
        }

        // 2. Connect WebSocket stream
        this.connectWebSocket();
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/simulation`;
        const statusPill = document.getElementById('wsStatusPill');

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('TraCI 3D WebSocket Connected');
            if (statusPill) {
                statusPill.className = 'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400';
                statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span>LIVE</span>';
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'geometry') {
                    this.renderer3d.setGeometry(msg.data);
                } else if (msg.time !== undefined) {
                    this.latestState = msg;
                    this.isPaused = msg.paused;
                    this.currentScenario = msg.scenario;

                    // Pass update directly to 3D Three.js renderer
                    this.renderer3d.update(msg);

                    // Update UI controls and compact telemetry HUD
                    this.controls.updatePlayPauseUI(this.isPaused);
                    this.controls.setScenarioUI(this.currentScenario, msg.event_phase);
                    this.updateTelemetryHUD(msg);
                }
            } catch (err) {
                console.error('Error parsing simulation packet:', err);
            }
        };

        this.ws.onclose = () => {
            console.warn('WebSocket Disconnected. Reconnecting in 2s...');
            if (statusPill) {
                statusPill.className = 'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-950/60 border border-rose-500/30 text-rose-400';
                statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span><span>OFFLINE</span>';
            }
            setTimeout(() => this.connectWebSocket(), 2000);
        };

        this.ws.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
    }

    updateTelemetryHUD(state) {
        if (!state) return;
        const kpi = state.kpis;
        if (!kpi) return;

        // Top Clock
        const simTime = state.time || 0;
        const mins = Math.floor(simTime / 60).toString().padStart(2, '0');
        const secs = (simTime % 60).toFixed(1).padStart(4, '0');
        const clockEl = document.getElementById('simTimeDisplay');
        if (clockEl) clockEl.innerText = `${mins}:${secs}`;

        // Compact HUD values
        this.setText('kpiVehicles', kpi.active_vehicles);
        this.setText('kpiPedestrians', kpi.active_pedestrians);
        this.setText('kpiBuses', kpi.active_buses);
        this.setText('kpiSpeed', `${kpi.avg_speed_kmh} km/h`);
        this.setText('kpiQueue', `${kpi.total_queue_length_m}m`);
        this.setText('kpiStadiumVisitors', kpi.stadium_visitors_total);
        this.setText('kpiRailArrivals', kpi.railway_arrivals_total);
        this.setText('kpiCongestionVal', `${kpi.overall_congestion_pct}%`);

        // Trains count
        const trainCount = (state.vehicles || []).filter(v => v.type === 'train').length;
        this.setText('kpiTrains', trainCount > 0 ? trainCount : 1);

        // Congestion Bar
        const congBar = document.getElementById('kpiCongestionBar');
        const congVal = document.getElementById('kpiCongestionVal');
        if (congBar && congVal) {
            congBar.style.width = `${Math.min(100, kpi.overall_congestion_pct)}%`;
            if (kpi.overall_congestion_pct > 65) {
                congBar.className = 'bg-rose-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_#f43f5e]';
                congVal.className = 'text-rose-400 font-bold';
            } else if (kpi.overall_congestion_pct > 30) {
                congBar.className = 'bg-amber-400 h-full rounded-full transition-all duration-300';
                congVal.className = 'text-amber-400 font-bold';
            } else {
                congBar.className = 'bg-emerald-400 h-full rounded-full transition-all duration-300';
                congVal.className = 'text-emerald-400 font-bold';
            }
        }
    }

    setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }

    sendAction(action, payload = {}) {
        const message = { action, ...payload };
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            if (action === 'start') fetch(`/api/control/start?scenario=${payload.scenario || 'normal_day'}`, { method: 'POST' });
            else if (action === 'pause') fetch('/api/control/pause', { method: 'POST' });
            else if (action === 'resume') fetch('/api/control/resume', { method: 'POST' });
            else if (action === 'reset') fetch('/api/control/reset', { method: 'POST' });
            else if (action === 'set_speed') fetch(`/api/control/speed?multiplier=${payload.multiplier || 1.0}`, { method: 'POST' });
            else if (action === 'set_scenario') fetch(`/api/control/scenario?scenario=${payload.scenario || 'normal_day'}`, { method: 'POST' });
        }
    }
}

// Instantiate application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TrafficDigitalTwinApp();
});
