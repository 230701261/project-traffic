/**
 * Floating HUD Controls & 3D Camera Manager
 */

class ControlsManager {
    constructor(app) {
        this.app = app;
        this.bindControls();
    }

    bindControls() {
        // 1. Play / Pause Button
        const btnPlayPause = document.getElementById('btnPlayPause');
        if (btnPlayPause) {
            btnPlayPause.addEventListener('click', () => {
                if (this.app.isPaused) {
                    this.app.sendAction('resume');
                } else {
                    this.app.sendAction('pause');
                }
            });
        }

        // 2. Reset Button
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.app.sendAction('reset');
            });
        }

        // 3. Scenario Selector Buttons
        const btnNormal = document.getElementById('btnScenarioNormal');
        const btnEvent = document.getElementById('btnScenarioEvent');
        if (btnNormal && btnEvent) {
            btnNormal.addEventListener('click', () => {
                this.setScenarioUI('normal_day');
                this.app.sendAction('set_scenario', { scenario: 'normal_day' });
            });
            btnEvent.addEventListener('click', () => {
                this.setScenarioUI('event_day');
                this.app.sendAction('set_scenario', { scenario: 'event_day' });
            });
        }

        // 4. Speed Multipliers
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseFloat(e.target.dataset.speed || '1.0');
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active', 'bg-cyan-600/30', 'text-cyan-300', 'border', 'border-cyan-500/30'));
                e.target.classList.add('active', 'bg-cyan-600/30', 'text-cyan-300', 'border', 'border-cyan-500/30');
                this.app.sendAction('set_speed', { multiplier: speed });
            });
        });

        // 5. 3D Camera Quick Presets
        document.querySelectorAll('.cam-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.cam-preset-btn').dataset.target;
                document.querySelectorAll('.cam-preset-btn').forEach(b => b.classList.remove('active', 'bg-blue-600/30', 'text-blue-300'));
                e.target.closest('.cam-preset-btn').classList.add('active', 'bg-blue-600/30', 'text-blue-300');
                if (this.app.renderer3d) {
                    this.app.renderer3d.focusCamera(target);
                }
            });
        });

        // 6. Layer Toggles
        const toggleMap = {
            layerVehicles: 'vehicles',
            layerPedestrians: 'pedestrians',
            layerSignals: 'signals',
            layerBuildings: 'buildings'
        };
        for (const [elemId, layerKey] of Object.entries(toggleMap)) {
            const el = document.getElementById(elemId);
            if (el) {
                el.addEventListener('change', (e) => {
                    if (this.app.renderer3d) {
                        this.app.renderer3d.layers[layerKey] = e.target.checked;
                    }
                });
            }
        }
    }

    setScenarioUI(scenario, eventPhase = null) {
        const btnNormal = document.getElementById('btnScenarioNormal');
        const btnEvent = document.getElementById('btnScenarioEvent');
        const hudBadge = document.getElementById('hudScenarioBadge');
        const phaseBadge = document.getElementById('eventPhaseBadge');
        const phaseText = document.getElementById('eventPhaseText');
        if (!btnNormal || !btnEvent) return;

        if (scenario === 'event_day') {
            btnEvent.className = 'scenario-btn active px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all';
            btnNormal.className = 'scenario-btn px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all text-slate-400 hover:text-white';
            
            if (hudBadge) {
                hudBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-950/80 border border-amber-500/30 text-amber-400';
                hudBadge.innerText = 'EVENT SURGE';
            }

            if (phaseBadge && phaseText && eventPhase) {
                phaseBadge.classList.remove('hidden');
                phaseText.innerText = eventPhase;
            }
        } else {
            btnNormal.className = 'scenario-btn active px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all';
            btnEvent.className = 'scenario-btn px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all text-slate-400 hover:text-white';
            
            if (hudBadge) {
                hudBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400';
                hudBadge.innerText = 'NORMAL DAY';
            }

            if (phaseBadge) {
                phaseBadge.classList.add('hidden');
            }
        }
    }

    updatePlayPauseUI(isPaused) {
        const playIcon = document.getElementById('playIcon');
        const playText = document.getElementById('playText');
        const btn = document.getElementById('btnPlayPause');
        if (!playIcon || !playText || !btn) return;

        if (isPaused) {
            playIcon.innerText = '▶';
            playText.innerText = 'Start';
            btn.className = 'p-1.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow transition-all';
        } else {
            playIcon.innerText = '⏸';
            playText.innerText = 'Pause';
            btn.className = 'p-1.5 px-3 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow transition-all';
        }
    }
}
