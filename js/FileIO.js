class FileIO {
    constructor(state, renderer) {
        this.state = state;
        this.renderer = renderer;
    }

    save() {
        try { localStorage.setItem('comp_data', JSON.stringify({ elements: this.state.elements, connections: this.state.connections, idCounter: this.state.idCounter, connCounter: this.state.connCounter })); }
        catch(e) {}
    }

    load() {
        try {
            const data = JSON.parse(localStorage.getItem('comp_data'));
            if(data && data.elements && data.elements.length > 0) {
                this.state.elements = data.elements;
                this.state.connections = data.connections || [];
                this.state.idCounter = data.idCounter || 0;
                this.state.connCounter = data.connCounter || 0;
                this.state.elements.forEach(el => this.renderer.renderElement(el));
                setTimeout(() => { this.state.connections.forEach(c => this.renderer.renderConn(c)); this.renderer.renderAllConnLabels(); }, 100);
                return true;
            }
        } catch(e) {}
        return false;
    }

    saveDiagram() {
        document.getElementById('saveFileName').value = 'diagrama-componentes.json';
        document.getElementById('saveModal').style.display = 'flex';
    }

    async confirmSave() {
        const fileName = document.getElementById('saveFileName').value.trim() || 'diagrama-componentes.json';
        document.getElementById('saveModal').style.display = 'none';
        const data = { elements: this.state.elements, connections: this.state.connections, idCounter: this.state.idCounter, connCounter: this.state.connCounter };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        if('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
                });
                const w = await handle.createWritable();
                await w.write(blob); await w.close(); return;
            } catch(e) { if(e.name === 'AbortError') return; }
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
    }

    async loadDiagram() {
        if('showOpenFilePicker' in window) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
                });
                this.loadFromFileObj(await handle.getFile());
            } catch(e) { if(e.name === 'AbortError') return; }
        } else document.getElementById('fileInput').click();
    }

    loadFromFile(input) {
        if(input.files[0]) { this.loadFromFileObj(input.files[0]); input.value = ''; }
    }

    loadFromFileObj(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.renderer.clearCanvas();
                this.state.selectedIds.clear();
                this.state.elements = data.elements;
                this.state.connections = data.connections || [];
                this.state.idCounter = data.idCounter || 0;
                this.state.connCounter = data.connCounter || 0;
                this.state.elements.forEach(el => this.renderer.renderElement(el));
                setTimeout(() => { this.state.connections.forEach(c => this.renderer.renderConn(c)); this.renderer.renderAllConnLabels(); this.save(); }, 100);
            } catch(err) { alert('Error: ' + err.message); }
        };
        reader.readAsText(file);
    }

    addExample() {
        const a = (t, l, x, y, s) => {
            const id = 'el-' + this.state.idCounter++;
            const el = { id, type: t, x, y, width: 180, height: 80, label: l || 'Nuevo Componente', subtype: s || '', description: '' };
            this.state.elements.push(el);
            this.renderer.renderElement(el);
        };
        a('component', 'API Gateway', 80, 60, 'service');
        a('component', 'Usuarios Service', 80, 200, 'service');
        a('component', 'Pagos Service', 300, 200, 'service');
        a('component', 'PostgreSQL', 300, 50, 'database');
        a('component', 'Redis Cache', 500, 200, 'database');
        setTimeout(() => {
            const c = (f, t, s, l) => {
                const id = 'conn-' + this.state.connCounter++;
                const conn = { id, from: f, to: t, style: s, label: l || '' };
                this.state.connections.push(conn);
                this.renderer.renderConn(conn);
            };
            c('el-0:bottom', 'el-1:top', 'solid', 'HTTP');
            c('el-0:bottom', 'el-2:top', 'solid', 'HTTP');
            c('el-1:right', 'el-2:left', 'dashed', 'gRPC');
            c('el-1:right', 'el-4:left', 'dotted', 'cache');
            c('el-2:top', 'el-3:bottom', 'solid', 'SQL');
            this.renderer.renderAllConnLabels();
        }, 100);
    }
}
