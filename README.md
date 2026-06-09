# Diagrammer — Editor de Diagramas de Componentes

Editor visual de diagramas de arquitectura en un solo archivo HTML. Sin dependencias externas.

## Cómo usar

Abrir `diagrammer.html` en cualquier navegador moderno (Chrome/Edge recomendado).

## Funcionalidades

### Componentes

| Botón | Tipo | Color |
|-------|------|-------|
| ▢ Componente | Genérico | Violeta |
| ⚙ Servicio | Servicio / API | Azul |
| 🗄 BD | Base de datos | Verde |
| 🖥 Frontend | Interfaz de usuario | Rosa |
| ☰ Cola / Queue | Cola de mensajes | Naranja |

- **Agregar**: clic en botón de la barra o en la paleta lateral
- **Mover**: arrastrar el componente
- **Redimensionar**: arrastrar esquinas (8 handles)
- **Editar**: doble clic para cambiar nombre, descripción y tipo
- **Seleccionar**: clic simple; Ctrl+clic para multiselección

### Conexiones (Flujos)

1. Arrastrar desde un punto azul (`•`) en un componente hasta otro
2. Sueltas sobre el punto destino para crear la conexión

**Estilos disponibles** (selector en barra):
- → Sólida (gris)
- ⇢ Discontinua (naranja)
- ⇢ Punteada (violeta)

**Editar flujo**: doble clic sobre la línea o su etiqueta
- Cambiar estilo
- Cambiar etiqueta
- Revertir dirección

**Revertir**: seleccionar un flujo y presionar 🔁 Revertir Flujo

### Guías de alineación

Al arrastrar un componente, aparecen guías azules punteadas cuando se alinea (±6px) con otro componente. El elemento se ajusta automáticamente (snap).

### Zoom

- **Ctrl + Rueda** sobre el canvas: zoom (20% – 500%)
- Indicador de zoom en la barra: editable, escribir valor y Enter
- **Doble clic** en el indicador: reset a 100%

### Auto Layout

Botón **⊞ Auto Layout** en la barra: ordena todos los componentes en una grilla centrada dentro del canvas, actualizando las conexiones automáticamente.

### Portapapeles

- **📋 Copiar**: copia los componentes seleccionados
- **📄 Pegar**: pega los componentes copiados (desplazados +30px)
- Atajos: `Ctrl+C`, `Ctrl+V`

### Selección múltiple

- **Ctrl+clic**: agrega/quita de la selección
- **Rubber band**: arrastrar en espacio vacío del canvas para seleccionar varios
- **Ctrl+A**: selecciona todos los componentes y flujos
- **Delete**: elimina los elementos seleccionados

### Guardar / Cargar

- **💾 Guardar**: descarga el diagrama como archivo JSON
- **📂 Cargar**: abre un archivo JSON guardado previamente
- **Auto‑save**: los cambios se persisten automáticamente en `localStorage`

## Estructura de datos

### Elemento (componente)

```json
{
  "id": "el-0",
  "type": "component",
  "x": 80,
  "y": 60,
  "width": 180,
  "height": 80,
  "label": "API Gateway",
  "subtype": "service",
  "description": ""
}
```

### Conexión

```json
{
  "id": "conn-0",
  "from": "el-0:bottom",
  "to": "el-1:top",
  "style": "solid",
  "label": "HTTP"
}
```

`from` / `to` siguen el formato `{elementId}:{posición}` donde posición puede ser `top`, `bottom`, `left` o `right`.

## API de funciones

### Gestión de elementos

| Función | Descripción |
|---------|-------------|
| `addElement(type, label, x, y, subtype)` | Crea un nuevo componente |
| `renderElement(el)` | Renderiza un elemento en el DOM |
| `copySelected()` | Copia los elementos seleccionados al portapapeles interno |
| `pasteSelected()` | Pega los elementos copiados |
| `deleteSelected()` | Elimina elementos y flujos seleccionados |

### Conexiones

| Función | Descripción |
|---------|-------------|
| `startConn(e, id, pos)` | Inicia el arrastre de una conexión desde un punto |
| `updateTempConn(e)` | Actualiza la línea temporal durante el arrastre |
| `finishConn(e)` | Finaliza la conexión al soltar sobre otro punto |
| `createConn(from, to, style, label)` | Crea una conexión entre dos puertos |
| `renderConn(conn)` | Renderiza (o actualiza) una conexión como curva Bezier |
| `updateConns()` | Recalcula todas las conexiones |
| `getPoint(el, pos)` | Obtiene coordenadas absolutas del puerto indicado |
| `reverseConn()` | Invierte origen y destino del flujo seleccionado |

### Etiquetas de conexión

| Función | Descripción |
|---------|-------------|
| `getConnMidpoint(conn)` | Calcula el punto medio entre origen y destino |
| `renderAllConnLabels()` | Renderiza todas las etiquetas de conexión |

### Selección

| Función | Descripción |
|---------|-------------|
| `selectElement(id, ctrlKey)` | Selecciona un componente |
| `selectConn(id, ctrlKey)` | Selecciona una conexión |

### Edición (modales)

| Función | Descripción |
|---------|-------------|
| `openEditModal(id)` | Abre modal de edición de componente |
| `openConnModal(connId)` | Abre modal de edición de flujo |
| `saveEdit()` | Guarda cambios del modal de componente |
| `saveConnEdit()` | Guarda cambios del modal de flujo |
| `closeModal()`, `closeConnModal()` | Cierra modales |

### Layout

| Función | Descripción |
|---------|-------------|
| `autoLayout()` | Ordena componentes en grilla centrada |

### Guías de alineación

| Función | Descripción |
|---------|-------------|
| `clearGuides()` | Elimina todas las guías del SVG |
| `addGuideLine(x1, y1, x2, y2)` | Dibuja una guía vertical u horizontal |
| `getBounds(el)` | Devuelve l/r/t/b/cx/cy del elemento |
| `updateDragGuides(cursorX, cursorY)` | Detecta alineaciones y dibuja guías |

### Zoom

| Función | Descripción |
|---------|-------------|
| `updateZoomDisplay()` | Actualiza el indicador de zoom en la barra |
| `resetZoom()` | Restablece zoom a 100% |
| `applyZoomInput(input)` | Aplica zoom desde el input editable |

### Redimensionamiento

| Función | Descripción |
|---------|-------------|
| `doResize(e)` | Calcula nueva posición/tamaño según el handle arrastrado |

### Persistencia

| Función | Descripción |
|---------|-------------|
| `autoSave()` | Guarda en localStorage |
| `autoLoad()` | Restaura desde localStorage |
| `saveDiagram()` | Abre modal para guardar archivo |
| `confirmSave()` | Descarga el JSON del diagrama |
| `loadDiagram()` | Abre selector de archivos |
| `loadFromFile(input)` | Carga desde input file |
| `loadFromFileObj(file)` | Procesa el archivo y renderiza |

### Ejemplo

| Función | Descripción |
|---------|-------------|
| `addExample()` | Carga un diagrama de ejemplo con 5 componentes y 5 conexiones |

### Utilidades

| Función | Descripción |
|---------|-------------|
| `getFirstSelectedId()` | Devuelve el primer ID seleccionado |

## Variables de estado

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `elements` | Array | Todos los componentes |
| `connections` | Array | Todas las conexiones |
| `selectedIds` | Set | IDs de elementos seleccionados |
| `viewScale` | Number | Nivel de zoom (0.2 – 5) |
| `isDragging`, `isResizing`, `isConnecting`, `isRubberBanding` | Boolean | Flags de estado de interacción |

## Requisitos del sistema

- Navegador con soporte para `fetch`, `localStorage`, SVG, Canvas
- `showSaveFilePicker` / `showOpenFilePicker` (Chrome/Edge) para guardar/cargar con selector nativo; fallback a descarga por `<a>` / `<input>`
