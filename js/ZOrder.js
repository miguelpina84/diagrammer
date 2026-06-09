class ZOrder {
    constructor(state) {
        this.state = state;
    }

    bringToFront() {
        const sel = [...this.state.selectedIds].filter(id => !id.startsWith('conn-'));
        if(sel.length === 0) return alert('Selecciona un componente primero');
        sel.forEach(id => { const d = document.getElementById(id); if(d) d.style.zIndex = ++this.state.zCounter; });
        this.save();
    }

    sendToBack() {
        const sel = [...this.state.selectedIds].filter(id => !id.startsWith('conn-'));
        if(sel.length === 0) return alert('Selecciona un componente primero');
        sel.forEach(id => { const d = document.getElementById(id); if(d) d.style.zIndex = --this.state.zCounter; });
        this.save();
    }

    save() {
        try { localStorage.setItem('comp_data', JSON.stringify({ elements: this.state.elements, connections: this.state.connections, idCounter: this.state.idCounter, connCounter: this.state.connCounter })); }
        catch(e) {}
    }
}
