class Renderer {
    constructor(state) {
        this.state = state;
        this.canvas = document.getElementById('canvas');
        this.svg = document.getElementById('connections-svg');
        this.connLabels = new Map();
    }

    renderElement(el) {
        const div = document.createElement('div');
        div.id = el.id;
        div.className = `node component${el.subtype ? ' ' + el.subtype : ''}`;
        div.style.left = el.x + 'px';
        div.style.top = el.y + 'px';
        div.style.width = el.width + 'px';
        div.style.height = el.height + 'px';
        div.innerHTML = `
            <div class="comp-header">${el.subtype === 'database' ? '🗄' : el.subtype === 'frontend' ? '🖥' : el.subtype === 'queue' ? '☰' : el.subtype === 'service' ? '⚙' : '▢'} ${el.label}</div>
            <div class="comp-body">${el.description || ''}</div>
            <div class="conn-point top" data-node="${el.id}" data-pos="top"></div>
            <div class="conn-point bottom" data-node="${el.id}" data-pos="bottom"></div>
            <div class="conn-point left" data-node="${el.id}" data-pos="left"></div>
            <div class="conn-point right" data-node="${el.id}" data-pos="right"></div>
            <div class="resize-handle nw" data-handle="nw"></div>
            <div class="resize-handle ne" data-handle="ne"></div>
            <div class="resize-handle sw" data-handle="sw"></div>
            <div class="resize-handle se" data-handle="se"></div>`;
        this.canvas.appendChild(div);
        return div;
    }

    updateElementDom(el) {
        const dom = document.getElementById(el.id);
        if(!dom) return;
        dom.style.left = el.x + 'px';
        dom.style.top = el.y + 'px';
        dom.style.width = el.width + 'px';
        dom.style.height = el.height + 'px';
    }

    updateElementStyle(el) {
        const dom = document.getElementById(el.id);
        if(!dom) return;
        dom.className = `node component${el.subtype ? ' ' + el.subtype : ''}`;
        const h = dom.querySelector('.comp-header');
        if(h) h.innerHTML = `${el.subtype === 'database' ? '🗄' : el.subtype === 'frontend' ? '🖥' : el.subtype === 'queue' ? '☰' : el.subtype === 'service' ? '⚙' : '▢'} ${el.label}`;
        const b = dom.querySelector('.comp-body');
        if(b) b.textContent = el.description;
    }

    getPoint(el, pos) {
        const r = el.getBoundingClientRect();
        const cr = this.canvas.getBoundingClientRect();
        const s = this.state.viewScale;
        const pts = {
            top:    { x: (r.left + r.width/2 - cr.left) / s, y: (r.top - cr.top) / s },
            bottom: { x: (r.left + r.width/2 - cr.left) / s, y: (r.bottom - cr.top) / s },
            left:   { x: (r.left - cr.left) / s, y: (r.top + r.height/2 - cr.top) / s },
            right:  { x: (r.right - cr.left) / s, y: (r.top + r.height/2 - cr.top) / s }
        };
        return pts[pos] || { x: (r.left + r.width/2 - cr.left) / s, y: (r.top + r.height/2 - cr.top) / s };
    }

    renderConn(conn) {
        let g = document.getElementById(conn.id);
        if(!g) {
            g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.id = conn.id;
            g.classList.add('conn-group');

            const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hit.classList.add('conn-hit');
            hit.setAttribute('fill', 'none');
            hit.setAttribute('stroke', 'transparent');
            hit.setAttribute('stroke-width', '28');
            hit.setAttribute('pointer-events', 'stroke');
            hit.addEventListener('click', (e) => {
                e.stopPropagation();
                if(window.app) window.app.selectConn(conn.id, e.ctrlKey || e.metaKey);
            });
            hit.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if(window.app) window.app.openConnModal(conn.id);
            });
            hit.addEventListener('mouseenter', () => vis.classList.add('hover'));
            hit.addEventListener('mouseleave', () => vis.classList.remove('hover'));

            const arrowHit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            arrowHit.classList.add('conn-arrow-hit');
            arrowHit.setAttribute('r', '14');
            arrowHit.setAttribute('fill', 'transparent');
            arrowHit.setAttribute('pointer-events', 'fill');
            arrowHit.addEventListener('click', (e) => {
                e.stopPropagation();
                if(window.app) window.app.selectConn(conn.id, e.ctrlKey || e.metaKey);
            });
            arrowHit.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if(window.app) window.app.openConnModal(conn.id);
            });
            arrowHit.addEventListener('mouseenter', () => vis.classList.add('hover'));
            arrowHit.addEventListener('mouseleave', () => vis.classList.remove('hover'));

            const vis = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            vis.classList.add('connection-line');
            vis.setAttribute('pointer-events', 'none');
            if(conn.style === 'dashed') vis.classList.add('dashed');
            if(conn.style === 'dotted') vis.classList.add('dotted');
            const markerMap = { solid: 'url(#arrow)', dashed: 'url(#arrow-dashed)', dotted: 'url(#arrow-dotted)' };
            vis.setAttribute('marker-end', markerMap[conn.style] || markerMap.solid);

            g.appendChild(arrowHit);
            g.appendChild(hit);
            g.appendChild(vis);
            this.svg.appendChild(g);
        }
        const fromEl = document.getElementById(conn.from.split(':')[0]);
        const toEl = document.getElementById(conn.to.split(':')[0]);
        if(!fromEl || !toEl) return;
        const p1 = this.getPoint(fromEl, conn.from.split(':')[1]);
        const p2 = this.getPoint(toEl, conn.to.split(':')[1]);
        const fromPos = conn.from.split(':')[1];
        const toPos = conn.to.split(':')[1];
        const dx = Math.min(Math.abs(p2.x - p1.x) * 0.5, 150);
        const dy = Math.min(Math.abs(p2.y - p1.y) * 0.5, 150);
        const dirs = { top: -1, bottom: 1, left: -1, right: 1 };
        const o1 = dirs[fromPos] || 1;
        const o2 = dirs[toPos] || 1;
        const isHorizFrom = fromPos === 'left' || fromPos === 'right';
        const isHorizTo = toPos === 'left' || toPos === 'right';
        const cp1x = isHorizFrom ? p1.x + dx * o1 : p1.x;
        const cp1y = isHorizFrom ? p1.y : p1.y + dy * o1;
        const cp2x = isHorizTo ? p2.x + dx * o2 : p2.x;
        const cp2y = isHorizTo ? p2.y : p2.y + dy * o2;
        const d = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        g.querySelector('.conn-hit').setAttribute('d', d);
        g.querySelector('.connection-line').setAttribute('d', d);
        g.querySelector('.conn-arrow-hit').setAttribute('cx', p2.x);
        g.querySelector('.conn-arrow-hit').setAttribute('cy', p2.y);
    }

    updateConns() {
        this.state.connections.forEach(c => this.renderConn(c));
    }

    getConnMidpoint(conn) {
        const fromEl = document.getElementById(conn.from.split(':')[0]);
        const toEl = document.getElementById(conn.to.split(':')[0]);
        if(!fromEl || !toEl) return null;
        const p1 = this.getPoint(fromEl, conn.from.split(':')[1]);
        const p2 = this.getPoint(toEl, conn.to.split(':')[1]);
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    renderAllConnLabels() {
        this.connLabels.forEach((labelEl, connId) => { if(labelEl) labelEl.remove(); });
        this.connLabels.clear();
        this.state.connections.forEach(conn => {
            if(!conn.label) return;
            const mid = this.getConnMidpoint(conn);
            if(!mid) return;
            const label = document.createElement('div');
            label.className = 'conn-label';
            label.textContent = conn.label;
            label.style.left = (mid.x - 20) + 'px';
            label.style.top = (mid.y - 10) + 'px';
            label.dataset.connId = conn.id;
            label.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if(window.app) window.app.selectConn(conn.id, e.ctrlKey || e.metaKey);
            });
            label.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if(window.app) window.app.openConnModal(conn.id);
            });
            this.canvas.appendChild(label);
            this.connLabels.set(conn.id, label);
        });
    }

    clearCanvas() {
        document.querySelectorAll('.node, .conn-group, .conn-label').forEach(el => el.remove());
        this.connLabels.clear();
    }
}
