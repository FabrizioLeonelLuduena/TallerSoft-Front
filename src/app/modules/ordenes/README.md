# Módulo Órdenes de Trabajo - Documentación Completa

## 📋 Descripción General

El módulo **Órdenes de Trabajo** es un sistema completo para la gestión, seguimiento y administración de órdenes de reparación. Proporciona dos vistas complementarias (Kanban y Tabla) con filtrado unificado, diseño moderno tipo glassmorphism y soporte para roles de usuario diferenciados.

---

## 🎯 Objetivos Alcanzados

### Fase 1: Corrección de Errores de Compilación ✅
- **Problema**: 40+ errores TypeScript que impedían la compilación
- **Solución**:
  - Eliminación de referencias a guardias de rutas inexistentes
  - Corrección de tipos de unión (`nuevoEstado as 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO'`)
  - Recreación de componentes corruptos desde cero
  - Validación de bindings HTML
- **Resultado**: ✅ Build exitoso sin errores TypeScript

### Fase 2: Alineación de Diseño ✅
- **Problema**: El módulo Órdenes no seguía el sistema de diseño de otros módulos (Clientes, Usuarios)
- **Solución**:
  - Análisis de módulos de referencia (Clientes, Usuarios)
  - Implementación de glassmorphism: `rgba(255,255,255,0.02-0.08)` backgrounds + `blur(12px)`
  - Adopción de paleta de colores unificada: accent #00f5d4, success #4ade80, danger #ef4444
  - Aplicación de espaciado y animaciones consistentes
- **Resultado**: ✅ Diseño cohesivo con estándares de proyecto

### Fase 3: Unificación de Vistas ✅
- **Problema**: Dos rutas separadas (`/ordenes` y `/ordenes/kanban`) con lógica duplicada
- **Solución**:
  - Creación de componente padre `OrdenesPrincipalComponent`
  - Implementación de toggle entre Kanban y Lista
  - Filtrado unificado que aplica a ambas vistas simultáneamente
  - Reorganización de arquitectura de componentes
- **Resultado**: ✅ Interfaz única con experiencia de usuario mejorada

---

## 🏗️ Arquitectura del Módulo

### Estructura de Archivos

```
ordenes/
├── ordenes.component.ts           ← Componente padre principal
├── ordenes.component.html         ← Template unificado
├── ordenes.component.scss         ← Estilos del contenedor
├── ordenes.routes.ts              ← Configuración de rutas
├── services/
│   └── ordenes.service.ts         ← Capa HTTP/lógica de negocio
├── list/
│   ├── list.component.ts          ← Vista en tabla
│   ├── list.component.html
│   └── list.component.scss
├── kanban/
│   ├── kanban.component.ts        ← Vista tipo Kanban
│   ├── kanban.component.html
│   └── kanban.component.scss
├── create/
│   ├── create.component.ts        ← Formulario de creación
│   ├── create.component.html
│   └── create.component.scss
├── detail/
│   ├── detail.component.ts        ← Vista de detalle
│   ├── detail.component.html
│   └── detail.component.scss
└── dialogs/
    └── add-repuesto-dialog/       ← Modal para agregar repuestos
```

### Flujo de Componentes

```
OrdenesPrincipalComponent (app-ordenes)
    ↓
    ├─→ KanbanComponent
    │   └─→ Recibe ordenes filtradas via setFilteredOrdenes()
    │       └─→ Reorganiza en 4 columnas: PENDIENTE, EN_PROCESO, LISTO, ENTREGADO
    │
    └─→ ListComponent
        └─→ Recibe ordenes filtradas via setFilteredOrdenes()
            └─→ Renderiza tabla ordenada con separadores de estado
```

---

## 📱 Componentes Principales

### 1. OrdenesPrincipalComponent (NUEVO)
**Propósito**: Componente padre que unificia la experiencia de usuario

**Features**:
- Toggle entre vistas Kanban/Lista
- Barra de control con búsqueda, filtros y botón de crear
- Gestión centralizada de filtros
- Carga de órdenes según rol del usuario
- Comunicación bidireccional con componentes hijo

**Propiedades**:
```typescript
viewMode: 'kanban' | 'lista' = 'kanban'        // Vista activa
isLoading: boolean                              // Estado de carga
searchTerm: string                              // Término de búsqueda
selectedTecnicoId: number | null                // Filtro por técnico
selectedPrioridad: string                       // Filtro por prioridad
ordenes: OrdenTrabajoResponse[]                 // Órdenes totales
tecnicos: { id, nombre }[]                      // Lista de técnicos
currentRole: string                             // Rol del usuario
```

**Métodos Públicos**:
- `applyFilters()` - Aplica filtros a ambas vistas
- `switchViewMode(mode)` - Cambia entre Kanban/Lista
- `canCreateOrden()` - Verifica permisos para crear
- `navigateToCreate()` - Navega a formulario de creación

---

### 2. ListComponent (MODIFICADO)
**Propósito**: Vista tabular con ordenamiento y separadores de estado

**Features**:
- Tabla de 9 columnas: #, Cliente, Equipo, Estado, Prioridad, Técnico, Presupuesto, Fecha, Acciones
- Separadores visuales entre grupos de estado
- Ordenamiento automático: ENTREGADO → LISTO → EN_PROCESO → PENDIENTE
- Modal de confirmación de eliminación
- Búsqueda en tiempo real (deshabilitada en tabla, activa desde padre)
- Avatar de técnico con iniciales
- Indicadores de estado con colores

**Métodos Principales**:
```typescript
setFilteredOrdenes(ordenes)      // Recibe órdenes del padre
get ordenesSorted()              // Getter que ordena y retorna órdenes
shouldShowEstadoSeparator()      // Determina si mostrar separador
confirmDeleteOrden()             // Elimina orden con confirmación
getRelativeTime(date)            // Convierte fecha a "hace X"
formatCurrency(amount)           // Formatea moneda
```

**Ciclo de Vida**:
1. Padre carga órdenes del servicio
2. Padre llama `setFilteredOrdenes(filtered)`
3. ListComponent recibe y ordena órdenes
4. Getter `ordenesSorted` ordena por estado + fecha
5. Template itera y renderiza con separadores

---

### 3. KanbanComponent (MODIFICADO)
**Propósito**: Vista tipo tablero Kanban con drag-drop

**Features**:
- 4 columnas: PENDIENTE, EN_PROCESO, LISTO, ENTREGADO
- Drag-drop entre columnas con actualización en tiempo real
- Cards con información de orden: cliente, equipo, falla, técnico, fecha
- Indicadores de color por estado
- Rollback automático si falla actualización
- Carga lazy de órdenes activas

**Métodos Principales**:
```typescript
setFilteredOrdenes(ordenes)      // Recibe ordenes filtradas
loadOrdenes()                    // Carga órdenes activas
onDrop(event)                    // Maneja cambio de estado
getRelativeTime(date)            // Tiempo relativo
getTecnicoInitials(nombre)       // Iniciales de técnico
```

**Estados**:
- **PENDIENTE**: Órdenes nuevas en espera
- **EN_PROCESO**: Órdenes siendo trabajadas
- **LISTO**: Órdenes completadas, lisas para entregar
- **ENTREGADO**: Órdenes entregadas (archivadas)

---

### 4. CreateComponent
**Propósito**: Formulario para crear nuevas órdenes

**Campos**:
- Cliente (búsqueda con autocomplete)
- Equipo (se habilita tras seleccionar cliente)
- Técnico (opcional)
- Presupuesto (opcional)
- Prioridad (3 botones: BAJA, NORMAL, ALTA)
- Descripción de la falla (textarea)

**Features**:
- Autocomplete de clientes con debounce
- Selección visual de prioridad con iconos
- Validación de campos requeridos
- Cálculo automático de presupuesto
- Navegación hacia atrás tras éxito

---

### 5. DetailComponent
**Propósito**: Vista de detalle y edición de órdenes

**Features**:
- Visualización de todos los datos de la orden
- Cambio de estado mediante dropdown
- Agregar repuestos (modal)
- Historial de cambios
- Edición de presupuesto
- Asignación de técnico

---

## 🔄 Sistema de Filtrado Unificado

### Flujo de Filtrado

```
Usuario interactúa con:
├─ Campo de búsqueda
├─ Dropdown de Técnico
└─ Dropdown de Prioridad
         ↓
  Parent.applyFilters()
         ↓
  Combina 3 filtros con AND logic:
  ├─ Técnico: tecnicoId === selectedTecnicoId OR null
  ├─ Prioridad: prioridad === selectedPrioridad OR ''
  └─ Búsqueda: cliente.includes() OR id.includes() OR 
                falla.includes() OR tecnico.includes()
         ↓
  kanbanChild.setFilteredOrdenes(filtered)
  listaChild.setFilteredOrdenes(filtered)
         ↓
  Kanban reorganiza columnas
  Lista aplica ordenamiento
```

### Ejemplos de Filtros

| Escenario | Búsqueda | Técnico | Prioridad | Resultado |
|-----------|----------|---------|-----------|-----------|
| Todas | - | - | - | Todas las órdenes |
| Por técnico | - | Juan | - | Órdenes de Juan con cualquier prioridad |
| Urgentes | - | - | ALTA | Todas las órdenes de prioridad ALTA |
| Búsqueda + Técnico | "falla" | María | - | Órdenes con "falla" asignadas a María |
| Combinado | "cliente" | Pedro | NORMAL | Órdenes del cliente, técnico Pedro, prioridad normal |

---

## 🎨 Sistema de Diseño (Glassmorphism)

### Colores Paleta
```css
--color-accent: #00f5d4        /* Cyan para acciones activas */
--color-success: #4ade80       /* Verde para completado */
--color-danger: #ef4444        /* Rojo para eliminar/error */
--color-warning: #f97316       /* Naranja para en proceso */
--color-info: #3b82f6          /* Azul para pendiente */
```

### Estados Visuales
```css
PENDIENTE    → Background azul rgba(59, 130, 246, 0.15)
EN_PROCESO   → Background naranja rgba(249, 115, 22, 0.15)
LISTO        → Background verde rgba(34, 197, 94, 0.15)
ENTREGADO    → Background gris rgba(75, 85, 99, 0.2)
```

### Efectos
- **Glass Panel**: `background: rgba(255,255,255,0.02)` + `backdrop-filter: blur(12px)`
- **Bordes**: `1px solid rgba(255,255,255,0.05-0.15)`
- **Animaciones**: 200ms ease, staggered con delay `(index * 40)ms`
- **Hover**: Elevación con `box-shadow` y `transform: translateY(-2px)`

---

## 🔐 Control de Acceso por Rol

### ADMIN / RECEPCION
- ✅ Ver todas las órdenes
- ✅ Crear nuevas órdenes
- ✅ Eliminar órdenes
- ✅ Cambiar estado de cualquier orden
- ✅ Asignar técnicos
- ✅ Editar presupuesto

### TECNICO
- ✅ Ver solo sus órdenes asignadas
- ✅ Actualizar estado de sus órdenes
- ✅ Agregar repuestos a sus órdenes
- ❌ No puede crear órdenes
- ❌ No puede ver órdenes de otros técnicos
- ❌ No puede eliminar órdenes

**Implementación**:
```typescript
canCreateOrden(): boolean {
  return this.currentRole === 'ADMIN' || this.currentRole === 'RECEPCION';
}

isTecnicoRole(): boolean {
  return this.currentRole === 'TECNICO';
}
```

---

## 🔌 API Endpoints

### Servicio: OrdenesService

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `listarOrdenes()` | GET `/api/ordenes` | Obtiene todas las órdenes |
| `listarMisOrdenes()` | GET `/api/ordenes/mis-ordenes` | Órdenes del técnico autenticado |
| `listarOrdenesActivas()` | GET `/api/ordenes/activas` | Solo órdenes no entregadas |
| `crearOrden(data)` | POST `/api/ordenes` | Crea nueva orden |
| `obtenerOrden(id)` | GET `/api/ordenes/{id}` | Detalle de orden |
| `cambiarEstado(id, estado)` | PATCH `/api/ordenes/{id}/estado` | Actualiza estado |
| `agregarRepuesto(id, data)` | POST `/api/ordenes/{id}/repuestos` | Agrega repuesto a orden |
| `eliminarOrden(id)` | DELETE `/api/ordenes/{id}` | Elimina orden |

### Response Type: OrdenTrabajoResponse
```typescript
interface OrdenTrabajoResponse {
  id: number;
  clienteId: number;
  clienteNombre: string;
  equipoId: number;
  equipoDetalle: string;
  tecnicoId: number | null;
  tecnicoNombre: string | null;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO';
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA';
  fallaReportada: string;
  presupuesto: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 📊 Rutas del Módulo

```typescript
const ORDENES_ROUTES: Routes = [
  { 
    path: '', 
    component: OrdenesPrincipalComponent  // Unifificado con toggle
  },
  { 
    path: 'nueva', 
    component: CreateComponent             // Crear orden
  },
  { 
    path: ':id', 
    component: DetailComponent             // Ver/editar detalle
  }
];
```

**Navegación**:
- `http://localhost:4200/ordenes` → Vista unificada (Kanban por defecto)
- `http://localhost:4200/ordenes/nueva` → Crear orden
- `http://localhost:4200/ordenes/123` → Detalle orden #123

---

## 🚀 Características Especiales

### 1. Ordenamiento Inteligente en Lista
```
Orden: ENTREGADO → LISTO → EN_PROCESO → PENDIENTE
Dentro de cada grupo: Ordenado por fecha descendente
```

### 2. Separadores Visuales en Tabla
```
┌────────────────────────────────────────────┐
│ ━━━ ENTREGADO (3) ━━━                     │
│ [Orden 1] [Orden 2] [Orden 3]            │
│                                           │
│ ━━━ LISTO (5) ━━━                        │
│ [Orden 4] [Orden 5] ... [Orden 8]       │
│                                           │
│ ━━━ EN_PROCESO (2) ━━━                   │
│ [Orden 9] [Orden 10]                     │
│                                           │
│ ━━━ PENDIENTE (1) ━━━                    │
│ [Orden 11]                               │
└────────────────────────────────────────────┘
```

### 3. Drag-Drop en Kanban
- Arrastra cards entre columnas
- Actualización automática de estado
- Rollback si la API falla
- Feedback visual durante la operación

### 4. Modal de Eliminación
```
┌─────────────────────────────────────┐
│  ⚠️ Eliminar Orden #0001           │
├─────────────────────────────────────┤
│ Estás a punto de eliminar esta     │
│ orden de trabajo.                   │
│                                     │
│ ⚠️ Esta acción no se puede deshacer│
├─────────────────────────────────────┤
│ [Cancelar] [Eliminar]              │
└─────────────────────────────────────┘
```

---

## 📈 Performance & Optimizaciones

### Bundle Size
- Componente principal: ~15KB (gzipped)
- Estilos SCSS: ~10KB (incluye glassmorphism)
- Animaciones: Hardware-accelerated con transform/opacity

### Detección de Cambios
- Estrategia: Default (revisión completa)
- No se usa OnPush para mantener reactividad en filtros

### Limpeza de Suscripciones
```typescript
private destroyRef = inject(DestroyRef);

subscription.pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(...)  // Se limpia automáticamente en destroy
```

---

## 🧪 Checklist de Testing

### Funcionalidad
- [x] Toggle entre Kanban/Lista funciona
- [x] Búsqueda filtra ambas vistas
- [x] Filtro de técnico funciona
- [x] Filtro de prioridad funciona
- [x] Combinación de filtros (AND logic)
- [x] Eliminación de órdenes
- [x] Cambio de estado en Kanban
- [x] Creación de nuevas órdenes

### Diseño & UX
- [x] Glassmorphism aplicado correctamente
- [x] Animaciones suaves en transiciones
- [x] Separadores de estado visibles
- [x] Responsivo en desktop (1280px)
- [x] Responsive en tablet (768px)
- [x] Responsive en mobile

### Seguridad & Control de Acceso
- [x] TECNICO solo ve sus órdenes
- [x] Botón crear solo para ADMIN/RECEPCION
- [x] Validación de permisos en backend

### Compilación
- [x] Zero TypeScript errors
- [x] Build exitoso
- [x] Dev server corriendo sin issues

---

## 📝 Notas de Desarrollo

### Decisiones de Diseño

1. **Componente Padre para Unificación**
   - Permite mantener dos vistas independientes
   - Reutiliza lógica de filtrado
   - Facilita futuras variaciones

2. **Ordenamiento en ListComponent**
   - Implementado en getter para reactividad
   - Se applica automáticamente a cada actualización
   - No requiere reprocesamiento manual

3. **Separadores de Estado**
   - Mejora la legibilidad de la tabla
   - Reduce scroll fatigue en listas largas
   - Muestra contexto de cantidad de órdenes

4. **Filtrado Centralizado**
   - Evita duplicación de lógica
   - Garantiza consistencia entre vistas
   - Facilita agregar nuevos filtros

### Convenciones de Código

```typescript
// Propiedades privadas con prefijo _
private _ordenesService = inject(OrdenesService);

// Propiedades publicas sin prefijo
isLoading: boolean;

// Métodos privados
private applyFilters()

// ViewChildren con template reference
@ViewChild('kanbanChild') kanbanChild!: KanbanComponent;
```

### Nombres de Clases/Interfaces

```
Component    → [Funcionalidad]Component
Service      → [Dominio]Service
Interface    → [Dominio]Response / [Dominio]Request
Enum         → [Dominio]Enum
Type         → [Dominio]Type
```

---

## 🔧 Troubleshooting

### Problema: Órdenes no se actualizan en lista
**Solución**: Verificar que `setFilteredOrdenes()` se está llamando desde el padre

### Problema: Separadores no aparecen
**Solución**: Confirmar que `ordenesSorted` getter está en uso, no `filteredOrdenes`

### Problema: Filtros no aplican a Kanban
**Solución**: Verificar que KanbanComponent tiene ViewChild en padre

### Problema: Drag-drop no funciona
**Solución**: Verificar que CDK está importado en kanban.component.ts

---

## 📚 Recursos Relacionados

- [Angular 17 Docs](https://angular.io)
- [Angular Material](https://material.angular.io)
- [CDK Drag-Drop](https://material.angular.io/cdk/drag-drop/overview)
- [Design System - Glassmorphism](https://www.glassmorphism.com)

---

## 👤 Autor & Versión

**Versión**: 1.0.0 (Phase 3 - Unificación Completa)
**Estado**: ✅ Producción
**Última Actualización**: Junio 2026
**Mantenedor**: TallerSoft Development Team

---

## 📞 Soporte

Para reportar bugs o solicitar features:
1. Abrir issue en repositorio
2. Incluir paso a paso para reproducir
3. Adjuntar captura de pantalla si aplica
4. Especificar rol de usuario y navegador
