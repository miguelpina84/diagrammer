class Guides {
    constructor(state) {
        this.state = state;
        this.svg = document.getElementById('connections-svg');
        this.THRESHOLD = 6;
    }

    clear() {
        this.state.guideLines.forEach(g => g.remove());
        this.state.guideLines = [];
    }

    addLine(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#3b82f6');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '5,4');
        this.svg.appendChild(line);
        this.state.guideLines.push(line);
    }

    getBounds(el) {
        return { l: el.x, r: el.x + el.width, t: el.y, b: el.y + el.height, cx: el.x + el.width / 2, cy: el.y + el.height / 2 };
    }

    update(cursorX, cursorY) {
        this.clear();
        const s = this.state;
        if(!s.dragTarget) return null;
        const cr = document.getElementById('canvas').getBoundingClientRect();
        const cw = cr.width, ch = cr.height;
        const dx = cursorX - s.dragStartTargetX;
        const dy = cursorY - s.dragStartTargetY;

        let dl, dr, dt, db, dcx, dcy;
        if(s.dragStartPositions.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            s.dragStartPositions.forEach(({ id, x, y }) => {
                const el = s.elements.find(e => e.id === id);
                if(el) {
                    const ex = x + dx, ey = y + dy;
                    minX = Math.min(minX, ex); minY = Math.min(minY, ey);
                    maxX = Math.max(maxX, ex + el.width); maxY = Math.max(maxY, ey + el.height);
                }
            });
            dl = minX; dr = maxX; dt = minY; db = maxY; dcx = (minX + maxX) / 2; dcy = (minY + maxY) / 2;
        } else {
            dl = cursorX; dr = cursorX + s.dragTarget.width;
            dt = cursorY; db = cursorY + s.dragTarget.height;
            dcx = (dl + dr) / 2; dcy = (dt + db) / 2;
        }

        const others = s.elements.filter(el => !s.selectedIds.has(el.id));
        let snapX = null, snapY = null;

        for(const o of others) {
            const ob = this.getBounds(o);
            const checks = [
                { val: ob.l, type: 'x', guide: ob.l },
                { val: ob.r, type: 'x', guide: ob.r },
                { val: ob.cx, type: 'x', guide: ob.cx },
                { val: ob.t, type: 'y', guide: ob.t },
                { val: ob.b, type: 'y', guide: ob.b },
                { val: ob.cy, type: 'y', guide: ob.cy },
            ];
            for(const c of checks) {
                if(c.type === 'x') {
                    if(Math.abs(dl - c.val) < this.THRESHOLD) {
                        this.addLine(c.guide, 0, c.guide, ch);
                        if(snapX === null) snapX = c.guide - (dl - cursorX);
                    }
                    if(Math.abs(dr - c.val) < this.THRESHOLD) {
                        this.addLine(c.guide, 0, c.guide, ch);
                        if(snapX === null) snapX = c.guide - (dr - cursorX);
                    }
                    if(Math.abs(dcx - c.val) < this.THRESHOLD) {
                        this.addLine(c.guide, 0, c.guide, ch);
                        if(snapX === null) snapX = c.guide - (dcx - cursorX);
                    }
                } else {
                    if(Math.abs(dt - c.val) < this.THRESHOLD) {
                        this.addLine(0, c.guide, cw, c.guide);
                        if(snapY === null) snapY = c.guide - (dt - cursorY);
                    }
                    if(Math.abs(db - c.val) < this.THRESHOLD) {
                        this.addLine(0, c.guide, cw, c.guide);
                        if(snapY === null) snapY = c.guide - (db - cursorY);
                    }
                    if(Math.abs(dcy - c.val) < this.THRESHOLD) {
                        this.addLine(0, c.guide, cw, c.guide);
                        if(snapY === null) snapY = c.guide - (dcy - cursorY);
                    }
                }
            }
        }
        return { x: snapX !== null ? snapX : cursorX, y: snapY !== null ? snapY : cursorY };
    }
}
