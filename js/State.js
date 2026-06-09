class DiagramState {
    constructor() {
        this.elements = [];
        this.connections = [];
        this.idCounter = 0;
        this.connCounter = 0;
        this.copiedData = null;
        this.selectedIds = new Set();
        this.viewScale = 1.0;
        this.zCounter = 100;
        this.GRID = 20;
        this.guideLines = [];
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.dragStartPositions = [];
        this.dragStartTargetX = 0;
        this.dragStartTargetY = 0;
        this.isConnecting = false;
        this.connectingFromId = null;
        this.connectingFromPos = null;
        this.tempLine = null;
        this.isRubberBanding = false;
        this.rubberStartX = 0;
        this.rubberStartY = 0;
        this.rubberSelected = false;
        this.isResizing = false;
        this.resizeTarget = null;
        this.resizeHandle = '';
        this.resizeStartX = 0;
        this.resizeStartY = 0;
        this.resizeStartW = 0;
        this.resizeStartH = 0;
        this.resizeStartElX = 0;
        this.resizeStartElY = 0;
    }
    getFirstSelectedId() {
        return this.selectedIds.values().next().value;
    }
    snap(v) {
        return Math.round(v / this.GRID) * this.GRID;
    }
}
