class App {
    constructor() {
        this.state = new DiagramState();
        this.renderer = new Renderer(this.state);
        this.zoom = new Zoom(this.state);
        this.guides = new Guides(this.state);
        this.layout = new Layout(this.state, this.renderer);
        this.modals = new Modals(this.state, this.renderer);
        this.fileIO = new FileIO(this.state, this.renderer);
        this.zorder = new ZOrder(this.state);
        this.exportMgr = new ExportManager(this.state);
        this.events = new Events(this.state, this.renderer, this.zoom, this.guides, this.layout, this.modals, this.fileIO, this.zorder);

        window.app = this;

        this.init();
    }

    init() {
        if(!this.fileIO.load()) this.fileIO.addExample();
        this.zoom.updateDisplay();
    }

    addElement(type, label) {
        const defaults = {
            component: { label: 'Nuevo Componente', subtype: '' },
            service:    { label: 'Nuevo Servicio',   subtype: 'service' },
            frontend:   { label: 'Nuevo Frontend',   subtype: 'frontend' },
            database:   { label: 'Nueva Base de Datos', subtype: 'database' },
            queue:      { label: 'Nueva Cola',       subtype: 'queue' }
        };
        const d = defaults[type] || { label: 'Nuevo Elemento', subtype: type };
        this.events.addElement(type, label || d.label, null, null, d.subtype);
    }

    autoLayout() { this.layout.autoLayout(); }
    exportAsImage() { this.exportMgr.exportAsImage(); }
    bringToFront() { this.zorder.bringToFront(); }
    sendToBack() { this.zorder.sendToBack(); }
    resetZoom() { this.zoom.reset(); }
    applyZoomInput(input) { this.zoom.applyInput(input); }
    saveDiagram() { this.fileIO.saveDiagram(); }
    confirmSave() { this.fileIO.confirmSave(); }
    loadDiagram() { this.fileIO.loadDiagram(); }
    loadFromFile(input) { this.fileIO.loadFromFile(input); }
    copySelected() { this.events.copySelected(); }
    pasteSelected() { this.events.pasteSelected(); }
    deleteSelected() { this.events.deleteSelected(); }
    reverseConn() { this.events.reverseConn(); }
    selectConn(id, ctrlKey) { this.events.selectConn(id, ctrlKey); }
    openConnModal(id) { this.modals.openConnection(id); }
    saveConnEdit() { this.modals.saveConnection(); }
    closeConnModal() { this.modals.closeConnModal(); }
    saveEdit() { this.modals.saveComponent(); }
    closeModal() { this.modals.closeModal(); }
    closeSaveModal() { this.modals.closeSaveModal(); }
}
