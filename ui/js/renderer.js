/**
 * High-Performance Digital Twin Canvas Renderer
 * Renders SUMO Network, Moving Vehicles, Pedestrians, Traffic Lights, and Congestion Overlays.
 */

class SimulationRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Transform state
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        // Static network geometry
        this.geometry = null;
        this.bbox = { min_x: -150, min_y: -200, max_x: 1150, max_y: 1000 };

        // Layer toggles
        this.layers = {
            vehicles: true,
            pedestrians: true,
            signals: true,
            congestion: true,
            labels: true
        };

        // Hovered entity for tooltip
        this.hoveredEntity = null;
        this.mousePos = { x: 0, y: 0 };

        // Animation frame timer for water & floodlights
        this.animTime = 0;

        this.initCanvas();
        this.bindEvents();
    }

    initCanvas() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
        if (!this.geometry) {
            this.fitToBBox();
        }
    }

    setGeometry(geoData) {
        this.geometry = geoData;
        if (geoData.bbox) {
            this.bbox = geoData.bbox;
        }
        this.fitToBBox();
    }

    fitToBBox() {
        const padding = 60;
        const bw = (this.bbox.max_x - this.bbox.min_x) || 1200;
        const bh = (this.bbox.max_y - this.bbox.min_y) || 1100;
        
        const scaleX = (this.width - padding * 2) / bw;
        const scaleY = (this.height - padding * 2) / bh;
        this.scale = Math.min(scaleX, scaleY);
        
        this.offsetX = (this.width - bw * this.scale) / 2 - this.bbox.min_x * this.scale;
        this.offsetY = (this.height - bh * this.scale) / 2 + this.bbox.max_y * this.scale;
    }

    // World (SUMO) to Screen Coordinates
    worldToScreen(x, y) {
        const sx = x * this.scale + this.offsetX;
        const sy = this.offsetY - y * this.scale;
        return { x: sx, y: sy };
    }

    // Screen to World (SUMO) Coordinates
    screenToWorld(sx, sy) {
        const wx = (sx - this.offsetX) / this.scale;
        const wy = (this.offsetY - sy) / this.scale;
        return { x: wx, y: wy };
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX - this.offsetX;
            this.dragStartY = e.clientY - this.offsetY;
        });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

            if (this.isDragging) {
                this.offsetX = e.clientX - this.dragStartX;
                this.offsetY = e.clientY - this.dragStartY;
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
            const mouseWorld = this.screenToWorld(this.mousePos.x, this.mousePos.y);

            this.scale *= zoomFactor;
            this.scale = Math.max(0.2, Math.min(15.0, this.scale));

            this.offsetX = this.mousePos.x - mouseWorld.x * this.scale;
            this.offsetY = this.mousePos.y + mouseWorld.y * this.scale;
        }, { passive: false });
    }

    focusTarget(target) {
        if (target === 'stadium') {
            const center = this.worldToScreen(500, 450);
            this.scale = 2.2;
            this.offsetX = this.width / 2 - 500 * this.scale;
            this.offsetY = this.height / 2 + 450 * this.scale;
        } else if (target === 'station') {
            this.scale = 2.4;
            this.offsetX = this.width / 2 - 615 * this.scale;
            this.offsetY = this.height / 2 + 450 * this.scale;
        } else if (target === 'beach') {
            this.scale = 2.0;
            this.offsetX = this.width / 2 - 900 * this.scale;
            this.offsetY = this.height / 2 + 300 * this.scale;
        } else {
            this.fitToBBox();
        }
    }

    render(state) {
        if (!this.ctx) return;
        this.animTime += 0.03;
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, this.width, this.height);

        // 1. Render Background Grid & Landmarks
        this.renderLandmarks(ctx, state);

        // 2. Render Road Network & Sidewalks & Crossings
        if (this.geometry) {
            this.renderNetwork(ctx, state);
        }

        // 3. Render Congestion Heatmap Overlays
        if (this.layers.congestion && state && state.edges_congestion) {
            this.renderCongestionHeatmap(ctx, state.edges_congestion);
        }

        // 4. Render Pedestrians (Flow-coded)
        if (this.layers.pedestrians && state && state.pedestrians) {
            this.renderPedestrians(ctx, state.pedestrians);
        }

        // 5. Render Vehicles (Cars, Bikes, Buses, Trains)
        if (this.layers.vehicles && state && state.vehicles) {
            this.renderVehicles(ctx, state.vehicles);
        }

        // 6. Render Traffic Light Signals
        if (this.layers.signals && state && state.traffic_lights) {
            this.renderTrafficLights(ctx, state.traffic_lights);
        }

        // 7. Render Road & Landmark Text Labels
        if (this.layers.labels) {
            this.renderLabels(ctx, state);
        }

        // Check Entity Hover Tooltip
        this.checkHover(state);
    }

    renderLandmarks(ctx, state) {
        if (!this.geometry || !this.geometry.polygons) return;

        for (const poly of this.geometry.polygons) {
            const pts = poly.shape;
            if (pts.length < 3) continue;

            ctx.beginPath();
            const p0 = this.worldToScreen(pts[0][0], pts[0][1]);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < pts.length; i++) {
                const p = this.worldToScreen(pts[i][0], pts[i][1]);
                ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();

            if (poly.id === 'poly_ocean') {
                // Ocean dynamic shimmer gradient
                const grad = ctx.createLinearGradient(p0.x, 0, p0.x + 300, 0);
                grad.addColorStop(0, '#0284c7');
                grad.addColorStop(0.5, '#0369a1');
                grad.addColorStop(1, '#075985');
                ctx.fillStyle = grad;
                ctx.fill();
            } else if (poly.id === 'poly_marina_beach') {
                // Sand area
                ctx.fillStyle = '#ca8a0422';
                ctx.fill();
                ctx.strokeStyle = '#ca8a0444';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (poly.id === 'poly_stadium') {
                // Stadium Arena
                const isEvent = state && state.scenario === 'event_day';
                ctx.fillStyle = isEvent ? '#15803d44' : '#1e293b88';
                ctx.fill();
                ctx.strokeStyle = isEvent ? '#22c55e' : '#475569';
                ctx.lineWidth = isEvent ? 3 : 2;
                ctx.stroke();

                // Stadium floodlights pulse during event
                if (isEvent) {
                    ctx.save();
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = 15 + Math.sin(this.animTime * 3) * 5;
                    ctx.stroke();
                    ctx.restore();
                }
            } else if (poly.id === 'poly_stadium_pitch') {
                ctx.fillStyle = '#166534';
                ctx.fill();
                ctx.strokeStyle = '#22c55e88';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            } else if (poly.id === 'poly_station_building') {
                // Chepauk MRTS Building
                ctx.fillStyle = '#1e3a8a88';
                ctx.fill();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.fillStyle = poly.color || 'rgba(100,116,139,0.2)';
                ctx.fill();
            }
        }
    }

    renderNetwork(ctx, state) {
        // 1. Draw Sidewalks & Crossings
        for (const edge of this.geometry.edges) {
            for (const lane of edge.lanes) {
                if (lane.allow.includes('pedestrian') && !lane.allow.includes('passenger')) {
                    this.drawPolyline(ctx, lane.shape, '#33415566', Math.max(2, lane.width * this.scale));
                }
            }
        }

        // Draw Crossings
        if (this.geometry.crossings) {
            for (const c of this.geometry.crossings) {
                this.drawPolyline(ctx, c.shape, '#e2e8f0aa', Math.max(3, c.width * this.scale), [4, 4]);
            }
        }

        // 2. Draw Vehicular & Railway Roads
        for (const edge of this.geometry.edges) {
            const isRail = edge.id.includes('RAIL');
            for (const lane of edge.lanes) {
                if (lane.allow.includes('passenger') || lane.allow.includes('bus')) {
                    // Asphalt Road
                    const roadWidth = Math.max(3, lane.width * this.scale);
                    this.drawPolyline(ctx, lane.shape, '#1e293b', roadWidth);
                    // Lane separator marking
                    this.drawPolyline(ctx, lane.shape, '#47556988', 1, [6, 8]);
                } else if (isRail && (lane.allow.includes('rail') || lane.allow.includes('rail_urban'))) {
                    // Dedicated Railway track
                    const railWidth = Math.max(4, lane.width * this.scale);
                    this.drawPolyline(ctx, lane.shape, '#1e3a8a', railWidth);
                    this.drawPolyline(ctx, lane.shape, '#60a5fa', 1.5, [3, 6]); // Ties
                }
            }
        }

        // 3. Draw Bus Stops
        if (this.geometry.bus_stops) {
            for (const bs of this.geometry.bus_stops) {
                // Find lane shape
                const edge = this.geometry.edges.find(e => e.lanes.some(l => l.id === bs.lane));
                if (edge) {
                    const lane = edge.lanes.find(l => l.id === bs.lane);
                    if (lane && lane.shape.length >= 2) {
                        const midPt = lane.shape[Math.floor(lane.shape.length / 2)];
                        const p = this.worldToScreen(midPt[0], midPt[1]);
                        ctx.fillStyle = '#a855f7';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, Math.max(3, 4 * this.scale), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
    }

    renderCongestionHeatmap(ctx, edgesCongestion) {
        for (const [edgeId, cData] of Object.entries(edgesCongestion)) {
            const edge = this.geometry.edges.find(e => e.id === edgeId);
            if (!edge) continue;

            let color = 'rgba(16, 185, 129, 0.35)'; // Green
            if (cData.level === 'red') {
                color = 'rgba(239, 68, 68, 0.75)'; // Glowing Red
            } else if (cData.level === 'yellow') {
                color = 'rgba(245, 158, 11, 0.6)'; // Amber
            }

            for (const lane of edge.lanes) {
                if (lane.allow.includes('passenger') || lane.allow.includes('bus')) {
                    ctx.save();
                    if (cData.level === 'red') {
                        ctx.shadowColor = '#ef4444';
                        ctx.shadowBlur = 10;
                    }
                    this.drawPolyline(ctx, lane.shape, color, Math.max(3, (lane.width + 1.5) * this.scale));
                    ctx.restore();
                }
            }
        }
    }

    renderVehicles(ctx, vehicles) {
        for (const v of vehicles) {
            const pos = this.worldToScreen(v.x, v.y);
            const w = Math.max(3, (v.width || 1.8) * this.scale);
            const l = Math.max(5, (v.length || 4.5) * this.scale);

            // SUMO angle: 0 = North (up), 90 = East (right), 180 = South (down), 270 = West (left)
            // Canvas standard 0 rad = East, clockwise.
            const canvasAngle = (v.angle - 90) * (Math.PI / 180);

            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(canvasAngle);

            // Headlight beam
            if (v.type !== 'train') {
                const grad = ctx.createLinearGradient(0, 0, l * 2, 0);
                grad.addColorStop(0, 'rgba(255, 255, 200, 0.25)');
                grad.addColorStop(1, 'rgba(255, 255, 200, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(l / 2, -w / 2);
                ctx.lineTo(l * 2, -w * 1.5);
                ctx.lineTo(l * 2, w * 1.5);
                ctx.lineTo(l / 2, w / 2);
                ctx.closePath();
                ctx.fill();
            }

            // Vehicle Body Colors
            let bodyColor = '#06b6d4'; // Car: Cyan
            if (v.type === 'motorcycle') bodyColor = '#f97316'; // Bike: Orange
            else if (v.type === 'bus') bodyColor = '#a855f7'; // Bus: Purple
            else if (v.type === 'taxi') bodyColor = '#eab308'; // Taxi: Yellow
            else if (v.type === 'emergency') bodyColor = Math.sin(this.animTime * 10) > 0 ? '#ef4444' : '#3b82f6'; // Strobe
            else if (v.type === 'train') bodyColor = '#3b82f6'; // MRTS: Blue

            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = '#ffffff88';
            ctx.lineWidth = 1;

            // Draw Rounded Rectangle for vehicle
            ctx.beginPath();
            ctx.roundRect(-l / 2, -w / 2, l, w, Math.min(2, w / 2));
            ctx.fill();
            ctx.stroke();

            // Train window details
            if (v.type === 'train') {
                ctx.fillStyle = '#ffffff';
                for (let off = -l / 2 + 5; off < l / 2 - 5; off += 10) {
                    ctx.fillRect(off, -w / 3, 4, w * 0.66);
                }
            }

            ctx.restore();
        }
    }

    renderPedestrians(ctx, pedestrians) {
        for (const p of pedestrians) {
            const pos = this.worldToScreen(p.x, p.y);
            const radius = Math.max(2.2, 2.8 * (this.scale * 0.45));

            let pColor = '#94a3b8'; // Local: Grey
            if (p.dest_flow === 'stadium') pColor = '#facc15'; // Stadium: Yellow
            else if (p.dest_flow === 'beach') pColor = '#38bdf8'; // Beach: Light Blue

            ctx.save();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = pColor;
            ctx.shadowColor = pColor;
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.restore();
        }
    }

    renderTrafficLights(ctx, trafficLights) {
        if (!this.geometry || !this.geometry.nodes) return;

        for (const [tlId, tl] of Object.entries(trafficLights)) {
            const node = this.geometry.nodes.find(n => n.id === tlId);
            if (!node) continue;

            const pos = this.worldToScreen(node.x, node.y);
            const bulbRadius = Math.max(4, 5 * (this.scale * 0.5));

            // Housing
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, bulbRadius + 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Active LED
            let ledColor = '#10b981'; // Green
            if (tl.color === 'red') ledColor = '#ef4444';
            else if (tl.color === 'yellow') ledColor = '#f59e0b';

            ctx.save();
            ctx.fillStyle = ledColor;
            ctx.shadowColor = ledColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, bulbRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    renderLabels(ctx, state) {
        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Major Landmarks
        this.drawLabel(ctx, 'MA Chidambaram Stadium', 500, 450, '#22c55e', '#052e16');
        this.drawLabel(ctx, 'Chepauk MRTS Station', 615, 450, '#60a5fa', '#1e3a8a');
        this.drawLabel(ctx, 'Marina Beach', 950, 300, '#38bdf8', '#075985');
        this.drawLabel(ctx, 'Dr. MGR & Jayalalitha Memorial', 910, 680, '#34d399', '#064e3b');
        this.drawLabel(ctx, 'Presidency College', 785, 100, '#c084fc', '#581c87');

        // Major Arterial Road Corridors
        ctx.font = '700 10px JetBrains Mono, monospace';
        this.drawLabel(ctx, 'WALLAJAH ROAD (4-LANE)', 300, 770, '#94a3b8', '#0f172a');
        this.drawLabel(ctx, 'KAMARAJAR SALAI (4-LANE)', 840, 200, '#94a3b8', '#0f172a', -Math.PI / 2.2);
        this.drawLabel(ctx, 'PYCROFTS ROAD (4-LANE)', 450, 25, '#94a3b8', '#0f172a');
        this.drawLabel(ctx, 'BELLS ROAD', 400, 300, '#94a3b8', '#0f172a', -Math.PI / 2.05);
        this.drawLabel(ctx, 'QUAID-E-MILLATH RD', 80, 450, '#94a3b8', '#0f172a', -Math.PI / 2.05);
    }

    drawLabel(ctx, text, wx, wy, textColor, bgColor, rotation = 0) {
        const pos = this.worldToScreen(wx, wy);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        if (rotation !== 0) ctx.rotate(rotation);

        const metrics = ctx.measureText(text);
        const padding = 4;
        const w = metrics.width + padding * 2;
        const h = 16;

        ctx.fillStyle = bgColor + 'cc';
        ctx.strokeStyle = textColor + '66';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.fillText(text, 0, 1);
        ctx.restore();
    }

    drawPolyline(ctx, shape, strokeStyle, lineWidth, dash = []) {
        if (!shape || shape.length < 2) return;
        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (dash.length > 0) ctx.setLineDash(dash);

        ctx.beginPath();
        const p0 = this.worldToScreen(shape[0][0], shape[0][1]);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < shape.length; i++) {
            const p = this.worldToScreen(shape[i][0], shape[i][1]);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    checkHover(state) {
        if (!state) return;
        const tooltip = document.getElementById('inspectorTooltip');
        const tooltipContent = document.getElementById('tooltipContent');
        if (!tooltip || !tooltipContent) return;

        const mouseWorld = this.screenToWorld(this.mousePos.x, this.mousePos.y);
        let found = null;

        // Check vehicles
        if (state.vehicles) {
            for (const v of state.vehicles) {
                const dist = Math.hypot(v.x - mouseWorld.x, v.y - mouseWorld.y);
                if (dist < 12) {
                    found = {
                        type: 'Vehicle',
                        id: v.id,
                        vType: v.type.toUpperCase(),
                        speed: `${v.speed_kmh} km/h`,
                        lane: v.lane_id,
                        waiting: `${v.waiting_time}s`
                    };
                    break;
                }
            }
        }

        // Check pedestrians
        if (!found && state.pedestrians) {
            for (const p of state.pedestrians) {
                const dist = Math.hypot(p.x - mouseWorld.x, p.y - mouseWorld.y);
                if (dist < 8) {
                    found = {
                        type: 'Pedestrian',
                        id: p.id,
                        flow: p.dest_flow === 'stadium' ? '🏟️ Stadium Bound' : p.dest_flow === 'beach' ? '🌊 Beach Bound' : '🏘️ Local Trip',
                        speed: `${(p.speed * 3.6).toFixed(1)} km/h`,
                        edge: p.edge_id
                    };
                    break;
                }
            }
        }

        if (found) {
            let html = `<div class="font-bold text-cyan-300 border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
                <span>${found.type}</span>
                <span class="font-mono text-[10px] text-slate-400">#${found.id}</span>
            </div>`;
            for (const [k, val] of Object.entries(found)) {
                if (k !== 'type' && k !== 'id') {
                    html += `<div class="flex justify-between py-0.5"><span class="text-slate-400 capitalize">${k}:</span><span class="font-mono font-semibold">${val}</span></div>`;
                }
            }
            tooltipContent.innerHTML = html;
            tooltip.style.left = `${this.mousePos.x + 15}px`;
            tooltip.style.top = `${this.mousePos.y + 15}px`;
            tooltip.classList.remove('hidden');
        } else {
            tooltip.classList.add('hidden');
        }
    }
}
