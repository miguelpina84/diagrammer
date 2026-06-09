class Events {
    constructor(state, renderer, zoom, guides, layout, modals, fileIO, zorder) {
        this.state = state;
        this.renderer = renderer;
        this.zoom = zoom;
        this.guides = guides;
        this.layout = layout;
        this.modals = modals;
        this.fileIO = fileIO;
        this.zorder = zorder;
        this.init();
    }

    init() {
        const s = this.state;
        const r = this.renderer;
        const canvas = r.canvas;
        const svg = r.svg;

        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        canvas.addEventListener('wheel', (e) => this.zoom.handleWheel(e));
        canvas.addEventListener('click', (e) => this.onCanvasClick(e));

        canvas.addEventListener('mousedown', (e) => {
            const point = e.target.closest('.conn-point');
            if(point) {
                e.stopPropagation();
                this.startConn(e, point.dataset.node, point.dataset.pos);
                return;
            }
            const handle = e.target.closest('.resize-handle');
            if(handle) {
                const nodeEl = handle.closest('.node');
                if(nodeEl) {
                    const el = s.elements.find(el => el.id === nodeEl.id);
                    if(el) this.onResizeStart(e, el, handle.dataset.handle);
                }
                return;
            }
            const node = e.target.closest('.node');
            if(node) {
                const el = s.elements.find(el => el.id === node.id);
                if(el) this.onNodeMouseDown(e, el, node);
                return;
            }
            this.onCanvasMouseDown(e);
        });

        canvas.addEventListener('dblclick', (e) => {
            const node = e.target.closest('.node');
            if(node) {
                const el = s.elements.find(el => el.id === node.id);
                if(el) this.modals.openComponent(el.id);
                return;
            }
            const path = e.target.closest('.connection-line');
            if(path) {
                this.modals.openConnection(path.id);
                return;
            }
            const lbl = e.target.closest('.conn-label');
            if(lbl) {
                this.modals.openConnection(lbl.dataset.connId);
            }
        });
    }

    onMouseMove(e) {
        const s = this.state;
        const r = this.renderer;
        if(s.isRubberBanding) {
            const cr = r.canvas.getBoundingClientRect();
            const mx = (e.clientX - cr.left) / s.viewScale, my = (e.clientY - cr.top) / s.viewScale;
            const band = document.getElementById('rubberBand');
            const x = Math.min(s.rubberStartX, mx), y = Math.min(s.rubberStartY, my);
            band.style.left = x + 'px'; band.style.top = y + 'px';
            band.style.width = Math.abs(mx - s.rubberStartX) + 'px';
            band.style.height = Math.abs(my - s.rubberStartY) + 'px';
        }
        if(s.isResizing) { this.doResize(e); return; }
        if(s.isDragging && s.dragTarget) {
            const cr = r.canvas.getBoundingClientRect();
            const rawX = (e.clientX - cr.left) / s.viewScale - s.dragOffsetX;
            const rawY = (e.clientY - cr.top) / s.viewScale - s.dragOffsetY;
            const gx = s.snap(rawX), gy = s.snap(rawY);
            const snapped = this.guides.update(gx, gy);
            const fx = snapped ? snapped.x : gx;
            const fy = snapped ? snapped.y : gy;
            if(s.dragStartPositions.length > 0) {
                const dx = fx - s.dragStartTargetX;
                const dy = fy - s.dragStartTargetY;
                s.dragStartPositions.forEach(({ id, x, y }) => {
                    const ed = s.elements.find(el => el.id === id);
                    if(ed) { ed.x = x + dx; ed.y = y + dy; r.updateElementDom(ed); }
                });
            } else {
                s.dragTarget.x = fx; s.dragTarget.y = fy;
                r.updateElementDom(s.dragTarget);
            }
            r.updateConns();
            r.renderAllConnLabels();
        }
        if(s.isConnecting && s.tempLine) {
            const fromEl = document.getElementById(s.connectingFromId);
            if(!fromEl) return;
            const p1 = r.getPoint(fromEl, s.connectingFromPos);
            const cr = r.canvas.getBoundingClientRect();
            const p2 = { x: (e.clientX - cr.left) / s.viewScale, y: (e.clientY - cr.top) / s.viewScale };
            s.tempLine.setAttribute('d', `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`);
        }
    }

    onMouseUp(e) {
        const s = this.state;
        const r = this.renderer;
        if(s.isRubberBanding) {
            s.isRubberBanding = false; s.rubberSelected = false;
            const band = document.getElementById('rubberBand');
            const rw = parseInt(band.style.width), rh = parseInt(band.style.height);
            band.style.display = 'none';
            if(rw > 5 || rh > 5) {
                document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                s.selectedIds.clear();
                const cr = r.canvas.getBoundingClientRect();
                const mx = (e.clientX - cr.left) / s.viewScale;
                const my = (e.clientY - cr.top) / s.viewScale;
                const rx = Math.min(s.rubberStartX, mx);
                const ry = Math.min(s.rubberStartY, my);
                const rr = Math.max(s.rubberStartX, mx);
                const rb = Math.max(s.rubberStartY, my);
                s.elements.forEach(el => {
                    const dom = document.getElementById(el.id);
                    if(!dom) return;
                    const er = dom.getBoundingClientRect();
                    const elL = er.left - cr.left, elT = er.top - cr.top;
                    if(elL + er.width >= rx && elL <= rr && elT + er.height >= ry && elT <= rb) {
                        s.selectedIds.add(el.id); dom.classList.add('selected');
                    }
                });
                if(s.selectedIds.size > 0) s.rubberSelected = true;
            }
        }
        this.guides.clear();
        if(s.isResizing) { s.isResizing = false; s.resizeTarget = null; this.save(); }
        if(s.isDragging) this.save();
        s.isDragging = false; s.dragTarget = null;

        if(s.isConnecting) {
            if(s.tempLine) { s.tempLine.remove(); s.tempLine = null; }
            document.querySelectorAll('.conn-point').forEach(p => p.classList.remove('connecting'));
            const target = e.target;
            if(target && target.classList.contains('conn-point')) {
                const toId = target.dataset.node;
                const toPos = target.dataset.pos;
                if(s.connectingFromId !== toId) {
                    const style = document.getElementById('lineType').value;
                    this.createConn(s.connectingFromId + ':' + s.connectingFromPos, toId + ':' + toPos, style);
                }
            }
            s.isConnecting = false;
            s.connectingFromId = null;
            s.connectingFromPos = null;
        }
    }

    onCanvasMouseDown(e) {
        const s = this.state;
        if(e.target === this.renderer.canvas || e.target === this.renderer.svg || e.target.id === 'rubberBand') {
            const cr = this.renderer.canvas.getBoundingClientRect();
            s.isRubberBanding = true;
            s.rubberStartX = (e.clientX - cr.left) / s.viewScale;
            s.rubberStartY = (e.clientY - cr.top) / s.viewScale;
            const band = document.getElementById('rubberBand');
            band.style.left = s.rubberStartX + 'px'; band.style.top = s.rubberStartY + 'px';
            band.style.width = '0px'; band.style.height = '0px';
            band.style.display = 'block';
        }
    }

    onCanvasClick(e) {
        const s = this.state;
        if(s.rubberSelected) { s.rubberSelected = false; return; }
        if(e.target === this.renderer.canvas || e.target === this.renderer.svg) {
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            s.selectedIds.clear();
        }
    }

    selectElement(id, ctrlKey) {
        const s = this.state;
        if(ctrlKey) {
            if(s.selectedIds.has(id)) { s.selectedIds.delete(id); document.getElementById(id)?.classList.remove('selected'); }
            else { s.selectedIds.add(id); document.getElementById(id)?.classList.add('selected'); }
        } else {
            document.querySelectorAll('.node, .conn-group, .conn-label').forEach(e => e.classList.remove('selected'));
            s.selectedIds.clear();
            s.selectedIds.add(id);
            document.getElementById(id)?.classList.add('selected');
        }
    }

    selectConn(id, ctrlKey) {
        const s = this.state;
        const r = this.renderer;
        if(ctrlKey) {
            if(s.selectedIds.has(id)) {
                s.selectedIds.delete(id);
                document.getElementById(id)?.classList.remove('selected');
                const lbl = r.connLabels.get(id); if(lbl) lbl.classList.remove('selected');
            } else {
                s.selectedIds.add(id);
                document.getElementById(id)?.classList.add('selected');
                const lbl = r.connLabels.get(id); if(lbl) lbl.classList.add('selected');
            }
        } else {
            document.querySelectorAll('.node, .conn-group, .conn-label').forEach(e => e.classList.remove('selected'));
            s.selectedIds.clear();
            s.selectedIds.add(id);
            document.getElementById(id)?.classList.add('selected');
            const lbl = r.connLabels.get(id); if(lbl) lbl.classList.add('selected');
        }
    }

    startConn(e, id, pos) {
        const s = this.state;
        e.stopPropagation(); e.preventDefault();
        s.isConnecting = true;
        s.connectingFromId = id;
        s.connectingFromPos = pos;
        const fromEl = document.getElementById(id);
        const fromPoint = fromEl?.querySelector(`.conn-point[data-pos="${pos}"]`);
        if(fromPoint) fromPoint.classList.add('connecting');
        s.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        s.tempLine.setAttribute('stroke', '#3b82f6');
        s.tempLine.setAttribute('stroke-width', '2');
        s.tempLine.setAttribute('fill', 'none');
        s.tempLine.setAttribute('stroke-dasharray', '5,5');
        this.renderer.svg.appendChild(s.tempLine);
    }

    createConn(from, to, style, label) {
        const s = this.state;
        if(s.connections.find(c => c.from === from && c.to === to)) return;
        const conn = { id: 'conn-' + s.connCounter++, from, to, style, label: label || '' };
        s.connections.push(conn);
        this.renderer.renderConn(conn);
        this.renderer.renderAllConnLabels();
        this.save();
    }

    reverseConn() {
        const id = this.state.getFirstSelectedId();
        if(!id || !id.startsWith('conn-')) return alert('Selecciona un flujo primero');
        const conn = this.state.connections.find(c => c.id === id);
        if(!conn) return;
        const tmp = conn.from;
        conn.from = conn.to;
        conn.to = tmp;
        this.renderer.renderConn(conn);
        this.renderer.renderAllConnLabels();
        this.save();
    }

    copySelected() {
        const s = this.state;
        if(s.selectedIds.size === 0) return alert('Selecciona al menos un elemento');
        const els = s.elements.filter(e => s.selectedIds.has(e.id));
        if(els.length > 0) s.copiedData = JSON.parse(JSON.stringify(els));
    }

    pasteSelected() {
        const s = this.state;
        if(!s.copiedData) return alert('Nada copiado');
        const newElements = s.copiedData.map(el => ({ ...el, id: 'el-' + s.idCounter++, x: el.x + 30, y: el.y + 30 }));
        newElements.forEach(el => { s.elements.push(el); this.renderer.renderElement(el); });
        this.save();
    }

    deleteSelected() {
        const s = this.state;
        const r = this.renderer;
        if(s.selectedIds.size === 0) return alert('Selecciona al menos un elemento');
        s.selectedIds.forEach(id => {
            if(id.startsWith('conn-')) {
                s.connections = s.connections.filter(c => c.id !== id);
                document.getElementById(id)?.remove();
                const lbl = r.connLabels.get(id); if(lbl) { lbl.remove(); r.connLabels.delete(id); }
            } else {
                s.elements = s.elements.filter(e => e.id !== id);
                document.getElementById(id)?.remove();
                s.connections = s.connections.filter(c => {
                    if(c.from.startsWith(id) || c.to.startsWith(id)) {
                        document.getElementById(c.id)?.remove();
                        const lbl = r.connLabels.get(c.id); if(lbl) { lbl.remove(); r.connLabels.delete(c.id); }
                        return false;
                    } return true;
                });
            }
        });
        s.selectedIds.clear();
        this.save();
    }

    doResize(e) {
        const s = this.state;
        if(!s.isResizing || !s.resizeTarget) return;
        const dx = (e.clientX - s.resizeStartX) / s.viewScale;
        const dy = (e.clientY - s.resizeStartY) / s.viewScale;
        const minW = 140, minH = 60;
        let x = s.resizeStartElX, y = s.resizeStartElY;
        let w = s.resizeStartW, h = s.resizeStartH;

        if(s.resizeHandle === 'se') { const r = s.snap(x + w + dx), b = s.snap(y + h + dy); w = Math.max(minW, r - x); h = Math.max(minH, b - y); }
        else if(s.resizeHandle === 'sw') { const nx = s.snap(x + dx), b = s.snap(y + h + dy); x = nx; w = Math.max(minW, s.resizeStartElX + s.resizeStartW - nx); h = Math.max(minH, b - y); }
        else if(s.resizeHandle === 'ne') { const r = s.snap(x + w + dx), ny = s.snap(y + dy); w = Math.max(minW, r - x); y = ny; h = Math.max(minH, s.resizeStartElY + s.resizeStartH - ny); }
        else if(s.resizeHandle === 'nw') { const nx = s.snap(x + dx), ny = s.snap(y + dy); x = nx; y = ny; w = Math.max(minW, s.resizeStartElX + s.resizeStartW - nx); h = Math.max(minH, s.resizeStartElY + s.resizeStartH - ny); }

        s.resizeTarget.x = x; s.resizeTarget.y = y;
        s.resizeTarget.width = w; s.resizeTarget.height = h;
        this.renderer.updateElementDom(s.resizeTarget);
        this.renderer.updateConns();
        this.renderer.renderAllConnLabels();
    }

    onNodeMouseDown(e, el, div) {
        const s = this.state;
        if(e.target.classList.contains('conn-point')) return;
        if(e.target.classList.contains('resize-handle')) return;
        if(!s.selectedIds.has(el.id)) {
            this.selectElement(el.id, e.ctrlKey || e.metaKey);
        } else if (e.ctrlKey || e.metaKey) {
            this.selectElement(el.id, true);
            return;
        }
        s.isDragging = true;
        s.dragTarget = el;
        const r = div.getBoundingClientRect();
        s.dragOffsetX = (e.clientX - r.left) / s.viewScale;
        s.dragOffsetY = (e.clientY - r.top) / s.viewScale;
        if(s.selectedIds.size > 1) {
            s.dragStartPositions = [];
            s.selectedIds.forEach(sid => {
                const se = s.elements.find(e => e.id === sid);
                if(se) s.dragStartPositions.push({ id: sid, x: se.x, y: se.y });
            });
            s.dragStartTargetX = el.x;
            s.dragStartTargetY = el.y;
        } else s.dragStartPositions = [];
    }

    onResizeStart(e, el, handle) {
        const s = this.state;
        e.stopPropagation(); e.preventDefault();
        if(e.button !== 0) return;
        s.isResizing = true;
        s.resizeTarget = el;
        s.resizeHandle = handle;
        s.resizeStartX = e.clientX;
        s.resizeStartY = e.clientY;
        s.resizeStartW = el.width;
        s.resizeStartH = el.height;
        s.resizeStartElX = el.x;
        s.resizeStartElY = el.y;
    }

    addElement(type, label, x, y, subtype) {
        const s = this.state;
        const rect = this.renderer.canvas.getBoundingClientRect();
        const id = 'el-' + s.idCounter++;
        const w = 180, h = 80;
        const el = {
            id, type,
            x: x !== null ? x : rect.width / s.viewScale / 2 - 90 + (Math.random() * 40 - 20),
            y: y !== null ? y : rect.height / s.viewScale / 2 - 40 + (Math.random() * 40 - 20),
            label: label || 'Nuevo Componente',
            width: w, height: h,
            subtype: subtype || '',
            description: ''
        };
        s.elements.push(el);
        this.renderer.renderElement(el);
        this.save();
    }

    onKeyDown(e) {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if(e.key === 'Delete') { e.preventDefault(); this.deleteSelected(); }
        if(e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            this.state.selectedIds.clear();
            this.state.elements.forEach(el => {
                this.state.selectedIds.add(el.id);
                document.getElementById(el.id)?.classList.add('selected');
            });
            this.state.connections.forEach(c => {
                this.state.selectedIds.add(c.id);
                document.getElementById(c.id)?.classList.add('selected');
                const lbl = this.renderer.connLabels.get(c.id);
                if(lbl) lbl.classList.add('selected');
            });
            return;
        }
        if(e.ctrlKey && e.key === 'c') this.copySelected();
        if(e.ctrlKey && e.key === 'v') this.pasteSelected();
        if(e.ctrlKey && e.key === 's') { e.preventDefault(); this.fileIO.saveDiagram(); }
    }

    save() {
        try { localStorage.setItem('comp_data', JSON.stringify({ elements: this.state.elements, connections: this.state.connections, idCounter: this.state.idCounter, connCounter: this.state.connCounter })); }
        catch(e) {}
    }
}
