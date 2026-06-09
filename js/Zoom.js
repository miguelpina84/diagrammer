class Zoom {
    constructor(state) {
        this.state = state;
    }

    updateDisplay() {
        const el = document.getElementById('zoomDisplay');
        if(el) el.value = Math.round(this.state.viewScale * 100) + '%';
    }

    reset() {
        this.state.viewScale = 1.0;
        document.getElementById('canvas').style.transform = 'scale(1)';
        this.updateDisplay();
    }

    applyInput(input) {
        const pct = parseInt(input.value);
        if(isNaN(pct) || pct < 20 || pct > 500) { this.updateDisplay(); return; }
        this.state.viewScale = pct / 100;
        document.getElementById('canvas').style.transform = 'scale(' + this.state.viewScale + ')';
        this.updateDisplay();
    }

    handleWheel(e) {
        if(!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        this.state.viewScale = Math.max(0.2, Math.min(5, this.state.viewScale + delta));
        document.getElementById('canvas').style.transform = 'scale(' + this.state.viewScale + ')';
        this.updateDisplay();
    }
}
