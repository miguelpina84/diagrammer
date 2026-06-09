class Layout {
    constructor(state, renderer) {
        this.state = state;
        this.renderer = renderer;
    }

    autoLayout() {
        const s = this.state;
        if(s.elements.length === 0) return;
        const gapX = 60, gapY = 50, pad = 80;
        const maxW = Math.max(...s.elements.map(e => e.width));
        const maxH = Math.max(...s.elements.map(e => e.height));
        const cellW = maxW + gapX, cellH = maxH + gapY;
        const cols = Math.max(1, Math.ceil(Math.sqrt(s.elements.length * cellW / cellH)));
        const rows = Math.ceil(s.elements.length / cols);
        const sorted = [...s.elements].sort((a, b) => a.y - b.y || a.x - b.x);
        const cr = this.renderer.canvas.getBoundingClientRect();
        const totalW = cols * cellW - gapX;
        const totalH = rows * cellH - gapY;
        const startX = Math.max(pad, (cr.width / s.viewScale - totalW) / 2);
        const startY = Math.max(pad, (cr.height / s.viewScale - totalH) / 2);
        let row = 0, col = 0;
        sorted.forEach(el => {
            el.x = startX + col * cellW;
            el.y = startY + row * cellH;
            this.renderer.updateElementDom(el);
            col++;
            if(col >= cols) { col = 0; row++; }
        });
        this.renderer.updateConns();
        this.renderer.renderAllConnLabels();
        this.save();
    }

    save() {
        try { localStorage.setItem('comp_data', JSON.stringify({ elements: this.state.elements, connections: this.state.connections, idCounter: this.state.idCounter, connCounter: this.state.connCounter })); }
        catch(e) {}
    }
}
