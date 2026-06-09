class Modals {
    constructor(state, renderer) {
        this.state = state;
        this.renderer = renderer;
    }

    openComponent(id) {
        const el = this.state.elements.find(e => e.id === id);
        if(!el) return;
        document.getElementById('modalTitle').textContent = 'Editar Componente';
        document.getElementById('editLabel').value = el.label || '';
        document.getElementById('editConnLabel').value = '';
        document.getElementById('connLabelGroup').style.display = 'none';
        document.getElementById('compDescGroup').style.display = 'block';
        document.getElementById('compTypeGroup').style.display = 'block';
        document.getElementById('editCompDesc').value = el.description || '';
        document.getElementById('editCompType').value = el.subtype || '';
        document.getElementById('editModal').style.display = 'flex';
        this.state.selectedIds.clear();
        document.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
        this.state.selectedIds.add(id);
        document.getElementById(id)?.classList.add('selected');
    }

    openConnection(connId) {
        const conn = this.state.connections.find(c => c.id === connId);
        if(!conn) return;
        document.getElementById('editConnLabel2').value = conn.label || '';
        document.getElementById('editConnStyle').value = conn.style || 'solid';
        document.getElementById('connEditModal').style.display = 'flex';
        document.getElementById('connEditModal').dataset.connId = connId;
    }

    closeConnModal() { document.getElementById('connEditModal').style.display = 'none'; }

    saveConnection() {
        const connId = document.getElementById('connEditModal').dataset.connId;
        const conn = this.state.connections.find(c => c.id === connId);
        if(!conn) return;
        conn.label = document.getElementById('editConnLabel2').value || '';
        conn.style = document.getElementById('editConnStyle').value;
        this.renderer.renderConn(conn);
        this.renderer.renderAllConnLabels();
        this.save();
        this.closeConnModal();
    }

    saveComponent() {
        const id = this.state.getFirstSelectedId();
        const el = this.state.elements.find(e => e.id === id);
        if(!el) return;
        el.label = document.getElementById('editLabel').value || el.label;
        el.description = document.getElementById('editCompDesc').value || '';
        el.subtype = document.getElementById('editCompType').value || '';
        this.renderer.updateElementStyle(el);
        this.closeModal();
        this.save();
    }

    closeModal() { document.getElementById('editModal').style.display = 'none'; }
    closeSaveModal() { document.getElementById('saveModal').style.display = 'none'; }

    save() {
        try { localStorage.setItem('comp_data', JSON.stringify({ elements: this.state.elements, connections: this.state.connections, idCounter: this.state.idCounter, connCounter: this.state.connCounter })); }
        catch(e) {}
    }
}
