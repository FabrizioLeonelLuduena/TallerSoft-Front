/**
 * TallerSoft - Backend simulado para presentación de tesis
 * Puerto 8081: API principal (auth, clientes, ordenes, stock, cobros)
 * Puerto 8082: Analytics (dashboard, alertas, asistente IA)
 *
 * Uso: node mock-server.js
 */

const express = require('express');
const cors = require('cors');

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const HOY = new Date('2026-06-17T12:00:00.000Z');

function daysAgo(n) {
  const d = new Date(HOY);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function monthsAgo(n) {
  const d = new Date(HOY);
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

// ─── JWT helper (el frontend sólo decodifica, no verifica firma) ──────────────

function toBase64Url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createJWT(userId, email, rol) {
  const header  = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp     = Math.floor(HOY.getTime() / 1000) + 60 * 60 * 24;
  const payload = toBase64Url(JSON.stringify({ userId, email, rol, exp }));
  return `${header}.${payload}.mock_tesis_2026`;
}

function getUserIdFromReq(req) {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    const raw = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return raw.userId;
  } catch (_) { return 1; }
}

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────

const usuarios = [
  { id: 1, nombre: 'Alejandro García',   email: 'admin@tallersoft.com',  password: 'admin123',   telefono: '011-4523-1100', rol: 'ADMIN',    activo: true,  createdAt: daysAgo(180), avatarImage: null },
  { id: 2, nombre: 'Carlos Rodríguez',   email: 'carlos@tallersoft.com', password: 'tecnico123', telefono: '011-5534-2200', rol: 'TECNICO',  activo: true,  createdAt: daysAgo(150), avatarImage: null },
  { id: 3, nombre: 'María González',     email: 'maria@tallersoft.com',  password: 'tecnico123', telefono: '011-4489-3300', rol: 'TECNICO',  activo: true,  createdAt: daysAgo(120), avatarImage: null },
  { id: 4, nombre: 'Laura Fernández',    email: 'laura@tallersoft.com',  password: 'recep123',   telefono: '011-5556-4400', rol: 'RECEPCION',activo: true,  createdAt: daysAgo(90),  avatarImage: null },
  { id: 5, nombre: 'Pablo Morales',      email: 'pablo@tallersoft.com',  password: 'tecnico123', telefono: '011-4412-5500', rol: 'TECNICO',  activo: false, createdAt: daysAgo(200), avatarImage: null },
];

const clientes = [
  { id: 1, nombre: 'Juan Pérez',        telefono: '011-4523-1234', email: 'juan.perez@gmail.com',        direccion: 'Av. Corrientes 1234, CABA',    activo: true,  createdAt: daysAgo(120) },
  { id: 2, nombre: 'Sofía Martínez',    telefono: '011-5523-4567', email: 'sofia.martinez@hotmail.com',   direccion: 'Calle Florida 567, CABA',      activo: true,  createdAt: daysAgo(95)  },
  { id: 3, nombre: 'Roberto Sánchez',   telefono: '011-4890-2233', email: 'roberto.sanchez@gmail.com',    direccion: 'Av. Santa Fe 890, CABA',       activo: true,  createdAt: daysAgo(80)  },
  { id: 4, nombre: 'Ana López',         telefono: '011-5534-8899', email: 'ana.lopez@yahoo.com',          direccion: 'Calle Rivadavia 2345, CABA',   activo: true,  createdAt: daysAgo(70)  },
  { id: 5, nombre: 'Diego Fernández',   telefono: '011-4412-6677', email: 'diego.fdz@gmail.com',          direccion: 'Av. Belgrano 678, CABA',       activo: true,  createdAt: daysAgo(60)  },
  { id: 6, nombre: 'Valentina Torres',  telefono: '011-5590-3344', email: 'valen.torres@gmail.com',       direccion: 'Av. 9 de Julio 1001, CABA',   activo: true,  createdAt: daysAgo(45)  },
  { id: 7, nombre: 'Marcos Giménez',    telefono: '011-4478-1122', email: 'marcos.gimenez@outlook.com',   direccion: 'Calle Lavalle 321, CABA',      activo: true,  createdAt: daysAgo(30)  },
  { id: 8, nombre: 'Claudia Ruiz',      telefono: '011-5567-9988', email: 'claudia.ruiz@gmail.com',       direccion: 'Av. Callao 456, CABA',         activo: false, createdAt: daysAgo(110) },
];

const equipos = [
  { id: 1,  clienteId: 1, tipo: 'Smartphone', marca: 'Apple',   modelo: 'iPhone 13',          numeroSerie: 'IMEI: 352341087654321', observaciones: 'Con funda original', descripcion: null },
  { id: 2,  clienteId: 1, tipo: 'Laptop',     marca: 'Apple',   modelo: 'MacBook Pro 14" M1', numeroSerie: 'SN: C02FG3KXMD6T',     observaciones: null,                 descripcion: null },
  { id: 3,  clienteId: 2, tipo: 'Smartphone', marca: 'Samsung', modelo: 'Galaxy S22 Ultra',   numeroSerie: 'IMEI: 359245678901234', observaciones: null,                 descripcion: null },
  { id: 4,  clienteId: 3, tipo: 'Laptop',     marca: 'HP',      modelo: 'Pavilion 15',        numeroSerie: 'SN: 5CD2345678',        observaciones: 'Sin cargador orig.', descripcion: null },
  { id: 5,  clienteId: 4, tipo: 'Tablet',     marca: 'Apple',   modelo: 'iPad Air 5ta Gen',   numeroSerie: 'SN: DMPH234567',        observaciones: null,                 descripcion: null },
  { id: 6,  clienteId: 5, tipo: 'Smartphone', marca: 'Apple',   modelo: 'iPhone 12 Pro',      numeroSerie: 'IMEI: 356789012345678', observaciones: 'Pantalla con fisuras',descripcion: null },
  { id: 7,  clienteId: 6, tipo: 'PC Desktop', marca: 'Lenovo',  modelo: 'ThinkCentre M720',   numeroSerie: 'SN: PC1234567',         observaciones: null,                 descripcion: null },
  { id: 8,  clienteId: 7, tipo: 'Smart TV',   marca: 'Samsung', modelo: '55" Crystal UHD 4K', numeroSerie: 'SN: TV9876543',         observaciones: 'Control incluido',   descripcion: null },
  { id: 9,  clienteId: 4, tipo: 'Laptop',     marca: 'Dell',    modelo: 'Inspiron 15',        numeroSerie: 'SN: DL5678901',         observaciones: null,                 descripcion: null },
  { id: 10, clienteId: 2, tipo: 'Tablet',     marca: 'Samsung', modelo: 'Galaxy Tab S8',      numeroSerie: 'SN: GT78901234',        observaciones: null,                 descripcion: null },
];

const repuestos = [
  { id: 1,  nombre: 'Batería iPhone 13',              categoria: 'Baterías',       precio: 12500, stockActual: 5, stockMinimo: 3, stockBajo: 5,  critico: false, bajo: false, activo: true,  createdAt: daysAgo(180) },
  { id: 2,  nombre: 'Pantalla iPhone 13 OLED',        categoria: 'Pantallas',      precio: 28000, stockActual: 2, stockMinimo: 2, stockBajo: 4,  critico: false, bajo: true,  activo: true,  createdAt: daysAgo(175) },
  { id: 3,  nombre: 'Batería Samsung Galaxy S22',     categoria: 'Baterías',       precio: 9500,  stockActual: 8, stockMinimo: 3, stockBajo: 5,  critico: false, bajo: false, activo: true,  createdAt: daysAgo(160) },
  { id: 4,  nombre: 'Pantalla Samsung S22 Ultra',     categoria: 'Pantallas',      precio: 22000, stockActual: 1, stockMinimo: 2, stockBajo: 4,  critico: true,  bajo: true,  activo: true,  createdAt: daysAgo(155) },
  { id: 5,  nombre: 'Disco SSD Kingston 256GB',       categoria: 'Almacenamiento', precio: 35000, stockActual: 6, stockMinimo: 3, stockBajo: 5,  critico: false, bajo: false, activo: true,  createdAt: daysAgo(140) },
  { id: 6,  nombre: 'Memoria RAM DDR4 8GB',           categoria: 'Memoria',        precio: 18000, stockActual: 4, stockMinimo: 2, stockBajo: 3,  critico: false, bajo: false, activo: true,  createdAt: daysAgo(130) },
  { id: 7,  nombre: 'Conector Lightning iPhone',      categoria: 'Conectores',     precio: 5500,  stockActual: 0, stockMinimo: 3, stockBajo: 5,  critico: true,  bajo: true,  activo: true,  createdAt: daysAgo(120) },
  { id: 8,  nombre: 'Teclado Laptop HP 15',           categoria: 'Periféricos',    precio: 14000, stockActual: 3, stockMinimo: 2, stockBajo: 3,  critico: false, bajo: true,  activo: true,  createdAt: daysAgo(110) },
  { id: 9,  nombre: 'Pasta térmica Thermal Grizzly',  categoria: 'Accesorios',     precio: 1800,  stockActual: 12,stockMinimo: 5, stockBajo: 7,  critico: false, bajo: false, activo: true,  createdAt: daysAgo(100) },
  { id: 10, nombre: 'Cable USB-C 2m premium',         categoria: 'Accesorios',     precio: 3200,  stockActual: 7, stockMinimo: 5, stockBajo: 8,  critico: false, bajo: false, activo: true,  createdAt: daysAgo(90)  },
  { id: 11, nombre: 'Flex de volumen iPhone 12',      categoria: 'Conectores',     precio: 3800,  stockActual: 0, stockMinimo: 2, stockBajo: 3,  critico: true,  bajo: true,  activo: true,  createdAt: daysAgo(85)  },
  { id: 12, nombre: 'Ventilador laptop Dell',         categoria: 'Refrigeración',  precio: 8500,  stockActual: 2, stockMinimo: 2, stockBajo: 3,  critico: false, bajo: true,  activo: true,  createdAt: daysAgo(80)  },
  { id: 13, nombre: 'Batería Laptop HP 15',           categoria: 'Baterías',       precio: 16500, stockActual: 1, stockMinimo: 2, stockBajo: 3,  critico: true,  bajo: true,  activo: false, createdAt: daysAgo(75)  },
];

const ordenes = [
  // ── PENDIENTE ──────────────────────────────────────────────────────────────
  {
    id: 1, equipoId: 6,  clienteId: 5, clienteNombre: 'Diego Fernández',
    tecnicoId: null, tecnicoNombre: null,
    fallaReportada: 'Pantalla partida y táctil sin respuesta, no enciende tras caída',
    diagnostico: null, estado: 'PENDIENTE', prioridad: 'ALTA',
    presupuesto: 0, createdAt: daysAgo(2), updatedAt: daysAgo(2), repuestos: []
  },
  {
    id: 2, equipoId: 4,  clienteId: 3, clienteNombre: 'Roberto Sánchez',
    tecnicoId: null, tecnicoNombre: null,
    fallaReportada: 'Laptop no enciende, posible problema de placa madre',
    diagnostico: null, estado: 'PENDIENTE', prioridad: 'NORMAL',
    presupuesto: 0, createdAt: daysAgo(3), updatedAt: daysAgo(3), repuestos: []
  },
  {
    id: 3, equipoId: 8,  clienteId: 7, clienteNombre: 'Marcos Giménez',
    tecnicoId: null, tecnicoNombre: null,
    fallaReportada: 'Smart TV no enciende, backlight apagado',
    diagnostico: null, estado: 'PENDIENTE', prioridad: 'BAJA',
    presupuesto: 0, createdAt: daysAgo(1), updatedAt: daysAgo(1), repuestos: []
  },
  // ── EN_PROCESO ─────────────────────────────────────────────────────────────
  {
    id: 4, equipoId: 1,  clienteId: 1, clienteNombre: 'Juan Pérez',
    tecnicoId: 2, tecnicoNombre: 'Carlos Rodríguez',
    fallaReportada: 'Batería dura menos de 2 horas con carga al 100%',
    diagnostico: 'Batería degradada al 68% de capacidad. Requiere reemplazo urgente.',
    estado: 'EN_PROCESO', prioridad: 'NORMAL',
    presupuesto: 14500, createdAt: daysAgo(7), updatedAt: daysAgo(5),
    repuestos: [{ id: 1, repuestoId: 1, nombreRepuesto: 'Batería iPhone 13', cantidad: 1, precioUnit: 12500, total: 12500 }]
  },
  {
    id: 5, equipoId: 3,  clienteId: 2, clienteNombre: 'Sofía Martínez',
    tecnicoId: 3, tecnicoNombre: 'María González',
    fallaReportada: 'Pantalla con rayas verdes y táctil sin respuesta en sector inferior',
    diagnostico: 'Display dañado internamente por golpe lateral. Necesita reemplazo de pantalla.',
    estado: 'EN_PROCESO', prioridad: 'ALTA',
    presupuesto: 24000, createdAt: daysAgo(6), updatedAt: daysAgo(4),
    repuestos: [{ id: 2, repuestoId: 4, nombreRepuesto: 'Pantalla Samsung S22 Ultra', cantidad: 1, precioUnit: 22000, total: 22000 }]
  },
  {
    id: 6, equipoId: 5,  clienteId: 4, clienteNombre: 'Ana López',
    tecnicoId: 2, tecnicoNombre: 'Carlos Rodríguez',
    fallaReportada: 'iPad no carga, conector roto físicamente',
    diagnostico: 'Puerto de carga dañado por rotura mecánica. Reemplazo necesario más limpieza interna.',
    estado: 'EN_PROCESO', prioridad: 'NORMAL',
    presupuesto: 8500, createdAt: daysAgo(5), updatedAt: daysAgo(3), repuestos: []
  },
  {
    id: 7, equipoId: 2,  clienteId: 1, clienteNombre: 'Juan Pérez',
    tecnicoId: 3, tecnicoNombre: 'María González',
    fallaReportada: 'MacBook se calienta a más de 90°C y el ventilador hace ruido constante',
    diagnostico: 'Acumulación severa de polvo en disipadores. Limpieza completa + cambio de pasta térmica.',
    estado: 'EN_PROCESO', prioridad: 'NORMAL',
    presupuesto: 3600, createdAt: daysAgo(4), updatedAt: daysAgo(2),
    repuestos: [{ id: 3, repuestoId: 9, nombreRepuesto: 'Pasta térmica Thermal Grizzly', cantidad: 2, precioUnit: 1800, total: 3600 }]
  },
  // ── LISTO ──────────────────────────────────────────────────────────────────
  {
    id: 8, equipoId: 7,  clienteId: 6, clienteNombre: 'Valentina Torres',
    tecnicoId: 2, tecnicoNombre: 'Carlos Rodríguez',
    fallaReportada: 'PC no inicia, presenta pantalla azul con código MEMORY_MANAGEMENT',
    diagnostico: 'Módulo RAM defectuoso confirmado con memtest86. Reemplazado por RAM nueva. Sistema reinstalado.',
    estado: 'LISTO', prioridad: 'ALTA',
    presupuesto: 21000, createdAt: daysAgo(12), updatedAt: daysAgo(1),
    repuestos: [{ id: 4, repuestoId: 6, nombreRepuesto: 'Memoria RAM DDR4 8GB', cantidad: 1, precioUnit: 18000, total: 18000 }]
  },
  {
    id: 9, equipoId: 9,  clienteId: 4, clienteNombre: 'Ana López',
    tecnicoId: 3, tecnicoNombre: 'María González',
    fallaReportada: 'Laptop extremadamente lenta, 10 minutos en arrancar, se congela sola',
    diagnostico: 'HDD con múltiples sectores dañados (SMART crítico). Migración de datos a SSD + limpieza general.',
    estado: 'LISTO', prioridad: 'NORMAL',
    presupuesto: 38000, createdAt: daysAgo(10), updatedAt: daysAgo(2),
    repuestos: [{ id: 5, repuestoId: 5, nombreRepuesto: 'Disco SSD Kingston 256GB', cantidad: 1, precioUnit: 35000, total: 35000 }]
  },
  // ── ENTREGADO ──────────────────────────────────────────────────────────────
  {
    id: 10, equipoId: 10, clienteId: 2, clienteNombre: 'Sofía Martínez',
    tecnicoId: 2, tecnicoNombre: 'Carlos Rodríguez',
    fallaReportada: 'Tablet sumergida en agua, no enciende',
    diagnostico: 'Daño por líquido en placa principal. Limpieza ultrasónica con isopropílico 99%. Exitosa.',
    estado: 'ENTREGADO', prioridad: 'ALTA',
    presupuesto: 15000, createdAt: daysAgo(20), updatedAt: daysAgo(14), repuestos: []
  },
  {
    id: 11, equipoId: 4,  clienteId: 3, clienteNombre: 'Roberto Sánchez',
    tecnicoId: 3, tecnicoNombre: 'María González',
    fallaReportada: 'Teclado con varias teclas sin respuesta, flex doblado',
    diagnostico: 'Flex de teclado roto. Reemplazado por teclado nuevo compatible.',
    estado: 'ENTREGADO', prioridad: 'NORMAL',
    presupuesto: 17000, createdAt: daysAgo(18), updatedAt: daysAgo(10),
    repuestos: [{ id: 6, repuestoId: 8, nombreRepuesto: 'Teclado Laptop HP 15', cantidad: 1, precioUnit: 14000, total: 14000 }]
  },
  {
    id: 12, equipoId: 1,  clienteId: 1, clienteNombre: 'Juan Pérez',
    tecnicoId: 2, tecnicoNombre: 'Carlos Rodríguez',
    fallaReportada: 'iPhone no se escucha el altavoz inferior en llamadas ni música',
    diagnostico: 'Altavoz dañado por humedad. Limpieza y reemplazo de membrana.',
    estado: 'ENTREGADO', prioridad: 'BAJA',
    presupuesto: 9500, createdAt: daysAgo(30), updatedAt: daysAgo(22), repuestos: []
  },
  {
    id: 13, equipoId: 5,  clienteId: 4, clienteNombre: 'Ana López',
    tecnicoId: 3, tecnicoNombre: 'María González',
    fallaReportada: 'iPad no conecta a WiFi aunque ve las redes',
    diagnostico: 'Chip WiFi con firmware corrupto. Restauración de software exitosa.',
    estado: 'ENTREGADO', prioridad: 'BAJA',
    presupuesto: 5000, createdAt: daysAgo(40), updatedAt: daysAgo(32), repuestos: []
  },
  // ── CANCELADO ──────────────────────────────────────────────────────────────
  {
    id: 14, equipoId: 3,  clienteId: 2, clienteNombre: 'Sofía Martínez',
    tecnicoId: null, tecnicoNombre: null,
    fallaReportada: 'Revisión general del equipo',
    diagnostico: null, estado: 'CANCELADO', prioridad: 'BAJA',
    presupuesto: 0, createdAt: daysAgo(25), updatedAt: daysAgo(24), repuestos: []
  },
];

const cobros = [
  { id: 1, ordenId: 10, clienteNombre: 'Sofía Martínez',  monto: 15000, montoRecibido: 20000, vuelto: 5000, medioPago: 'EFECTIVO',    estadoPago: 'APROBADO', mpLinkPago: null, mpQrBase64: null, mpQrImageUrl: null, createdAt: daysAgo(14) },
  { id: 2, ordenId: 11, clienteNombre: 'Roberto Sánchez', monto: 17000, montoRecibido: 17000, vuelto: 0,    medioPago: 'TARJETA',     estadoPago: 'APROBADO', mpLinkPago: null, mpQrBase64: null, mpQrImageUrl: null, createdAt: daysAgo(10) },
  { id: 3, ordenId: 12, clienteNombre: 'Juan Pérez',      monto: 9500,  montoRecibido: null,  vuelto: null, medioPago: 'MERCADOPAGO', estadoPago: 'APROBADO', mpLinkPago: 'https://mp.com/checkout/mock', mpQrBase64: null, mpQrImageUrl: null, createdAt: daysAgo(22) },
  { id: 4, ordenId: 13, clienteNombre: 'Ana López',       monto: 5000,  montoRecibido: 5000,  vuelto: 0,    medioPago: 'EFECTIVO',    estadoPago: 'APROBADO', mpLinkPago: null, mpQrBase64: null, mpQrImageUrl: null, createdAt: daysAgo(32) },
];

const alertasLeidas = {};

// ─── UTILS ────────────────────────────────────────────────────────────────────

function nextId(arr) { return arr.length > 0 ? Math.max(...arr.map(x => x.id)) + 1 : 1; }
function findIdx(arr, id) { return arr.findIndex(x => x.id === parseInt(id)); }
function notFound(res, msg) { return res.status(404).json({ message: msg }); }

// ─── APPS ────────────────────────────────────────────────────────────────────

const mainApp      = express();
const analyticsApp = express();

[mainApp, analyticsApp].forEach(app => {
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use((_, __, next) => setTimeout(next, 120)); // simulate latency
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN API  ─  PORT 8081
// ═══════════════════════════════════════════════════════════════════════════════

// ─── AUTH ────────────────────────────────────────────────────────────────────

mainApp.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = usuarios.find(u => u.email === email && u.password === password && u.activo);
  if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });
  const token = createJWT(user.id, user.email, user.rol);
  res.json({ token, userId: user.id, email: user.email, rol: user.rol });
});

mainApp.post('/auth/register', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (usuarios.find(u => u.email === email))
    return res.status(400).json({ message: 'El email ya está registrado' });
  const newUser = { id: nextId(usuarios), nombre, email, password, rol, telefono: null, activo: true, createdAt: new Date().toISOString(), avatarImage: null };
  usuarios.push(newUser);
  const { password: _, ...resp } = newUser;
  res.status(201).json(resp);
});

// ─── USUARIOS ────────────────────────────────────────────────────────────────

mainApp.get('/api/usuarios', (req, res) => {
  let result = usuarios.map(({ password, ...u }) => u);
  if (req.query.rol) result = result.filter(u => u.rol === req.query.rol);
  res.json(result);
});

mainApp.get('/api/usuarios/:id', (req, res) => {
  const user = usuarios.find(u => u.id === parseInt(req.params.id));
  if (!user) return notFound(res, 'Usuario no encontrado');
  const { password, ...resp } = user;
  res.json(resp);
});

mainApp.put('/api/usuarios/:id', (req, res) => {
  const idx = findIdx(usuarios, req.params.id);
  if (idx < 0) return notFound(res, 'Usuario no encontrado');
  const { nombre, email, telefono, rol } = req.body;
  usuarios[idx] = { ...usuarios[idx], nombre, email, telefono: telefono ?? usuarios[idx].telefono, rol };
  const { password, ...resp } = usuarios[idx];
  res.json(resp);
});

mainApp.delete('/api/usuarios/:id', (req, res) => {
  const idx = findIdx(usuarios, req.params.id);
  if (idx < 0) return notFound(res, 'Usuario no encontrado');
  usuarios[idx].activo = false;
  res.status(204).send();
});

mainApp.patch('/api/usuarios/:id/activar', (req, res) => {
  const idx = findIdx(usuarios, req.params.id);
  if (idx < 0) return notFound(res, 'Usuario no encontrado');
  usuarios[idx].activo = true;
  res.status(204).send();
});

mainApp.patch('/api/usuarios/:id/avatar', (req, res) => {
  const idx = findIdx(usuarios, req.params.id);
  if (idx < 0) return notFound(res, 'Usuario no encontrado');
  usuarios[idx].avatarImage = req.body.avatarImage ?? null;
  res.status(204).send();
});

// ─── CLIENTES ────────────────────────────────────────────────────────────────

mainApp.get('/api/clientes', (req, res) => {
  let result = [...clientes];
  if (req.query.incluirInactivos !== 'true') result = result.filter(c => c.activo);
  if (req.query.nombre) result = result.filter(c => c.nombre.toLowerCase().includes(req.query.nombre.toLowerCase()));
  res.json(result);
});

mainApp.get('/api/clientes/:id', (req, res) => {
  const c = clientes.find(c => c.id === parseInt(req.params.id));
  if (!c) return notFound(res, 'Cliente no encontrado');
  res.json(c);
});

mainApp.post('/api/clientes', (req, res) => {
  const newC = { id: nextId(clientes), ...req.body, activo: true, createdAt: new Date().toISOString() };
  clientes.push(newC);
  res.status(201).json(newC);
});

mainApp.put('/api/clientes/:id', (req, res) => {
  const idx = findIdx(clientes, req.params.id);
  if (idx < 0) return notFound(res, 'Cliente no encontrado');
  clientes[idx] = { ...clientes[idx], ...req.body };
  res.json(clientes[idx]);
});

mainApp.patch('/api/clientes/:id/activar', (req, res) => {
  const idx = findIdx(clientes, req.params.id);
  if (idx < 0) return notFound(res, 'Cliente no encontrado');
  clientes[idx].activo = true;
  res.status(204).send();
});

mainApp.delete('/api/clientes/:id', (req, res) => {
  const idx = findIdx(clientes, req.params.id);
  if (idx < 0) return notFound(res, 'Cliente no encontrado');
  clientes[idx].activo = false;
  res.status(204).send();
});

// ─── EQUIPOS ─────────────────────────────────────────────────────────────────

mainApp.get('/api/equipos/cliente/:clienteId', (req, res) => {
  res.json(equipos.filter(e => e.clienteId === parseInt(req.params.clienteId)));
});

mainApp.post('/api/equipos', (req, res) => {
  const newE = { id: nextId(equipos), ...req.body };
  equipos.push(newE);
  res.status(201).json(newE);
});

mainApp.put('/api/equipos/:id', (req, res) => {
  const idx = findIdx(equipos, req.params.id);
  if (idx < 0) return notFound(res, 'Equipo no encontrado');
  equipos[idx] = { ...equipos[idx], ...req.body };
  res.json(equipos[idx]);
});

mainApp.delete('/api/equipos/:id', (req, res) => {
  const idx = findIdx(equipos, req.params.id);
  if (idx < 0) return notFound(res, 'Equipo no encontrado');
  equipos.splice(idx, 1);
  res.status(204).send();
});

// ─── ORDENES  (específicas antes de /:id) ────────────────────────────────────

mainApp.get('/api/ordenes/activas', (req, res) => {
  res.json(ordenes.filter(o => ['PENDIENTE', 'EN_PROCESO', 'LISTO'].includes(o.estado)));
});

mainApp.get('/api/ordenes/mis-ordenes', (req, res) => {
  const uid = getUserIdFromReq(req);
  res.json(ordenes.filter(o => o.tecnicoId === uid));
});

mainApp.get('/api/ordenes/cliente/:clienteId', (req, res) => {
  res.json(ordenes.filter(o => o.clienteId === parseInt(req.params.clienteId)));
});

mainApp.get('/api/ordenes', (req, res) => {
  let result = [...ordenes];
  if (req.query.estado)    result = result.filter(o => o.estado === req.query.estado);
  if (req.query.tecnicoId) result = result.filter(o => o.tecnicoId === parseInt(req.query.tecnicoId));
  res.json(result);
});

mainApp.get('/api/ordenes/:id', (req, res) => {
  const o = ordenes.find(o => o.id === parseInt(req.params.id));
  if (!o) return notFound(res, 'Orden no encontrada');
  res.json(o);
});

mainApp.post('/api/ordenes', (req, res) => {
  const { equipoId, clienteId, tecnicoId, fallaReportada, prioridad } = req.body;
  const cliente = clientes.find(c => c.id === clienteId);
  const tecnico = tecnicoId ? usuarios.find(u => u.id === tecnicoId) : null;
  const now = new Date().toISOString();
  const newOrden = {
    id: nextId(ordenes), equipoId, clienteId,
    clienteNombre: cliente?.nombre ?? 'Desconocido',
    tecnicoId: tecnicoId ?? null,
    tecnicoNombre: tecnico?.nombre ?? null,
    fallaReportada, diagnostico: null,
    estado: 'PENDIENTE', prioridad,
    presupuesto: 0, createdAt: now, updatedAt: now, repuestos: []
  };
  ordenes.push(newOrden);
  res.status(201).json(newOrden);
});

mainApp.put('/api/ordenes/:id/estado', (req, res) => {
  const idx = findIdx(ordenes, req.params.id);
  if (idx < 0) return notFound(res, 'Orden no encontrada');
  ordenes[idx].estado    = req.body.nuevoEstado;
  ordenes[idx].updatedAt = new Date().toISOString();
  res.json(ordenes[idx]);
});

mainApp.put('/api/ordenes/:id/diagnostico', (req, res) => {
  const idx = findIdx(ordenes, req.params.id);
  if (idx < 0) return notFound(res, 'Orden no encontrada');
  ordenes[idx].diagnostico = req.body.diagnostico;
  ordenes[idx].updatedAt   = new Date().toISOString();
  res.json(ordenes[idx]);
});

mainApp.post('/api/ordenes/:ordenId/repuestos', (req, res) => {
  const idx = findIdx(ordenes, req.params.ordenId);
  if (idx < 0) return notFound(res, 'Orden no encontrada');
  const { repuestoId, cantidad } = req.body;
  const rep = repuestos.find(r => r.id === repuestoId);
  if (!rep) return notFound(res, 'Repuesto no encontrado');
  const allIds = ordenes.flatMap(o => o.repuestos.map(r => r.id));
  const newRep = { id: allIds.length > 0 ? Math.max(...allIds) + 1 : 1, repuestoId, nombreRepuesto: rep.nombre, cantidad, precioUnit: rep.precio, total: rep.precio * cantidad };
  ordenes[idx].repuestos.push(newRep);
  ordenes[idx].presupuesto = ordenes[idx].repuestos.reduce((s, r) => s + r.total, 0);
  ordenes[idx].updatedAt   = new Date().toISOString();
  res.json(ordenes[idx]);
});

mainApp.delete('/api/ordenes/:ordenId/repuestos/:ordenRepuestoId', (req, res) => {
  const idx = findIdx(ordenes, req.params.ordenId);
  if (idx < 0) return notFound(res, 'Orden no encontrada');
  ordenes[idx].repuestos = ordenes[idx].repuestos.filter(r => r.id !== parseInt(req.params.ordenRepuestoId));
  ordenes[idx].presupuesto = ordenes[idx].repuestos.reduce((s, r) => s + r.total, 0);
  ordenes[idx].updatedAt   = new Date().toISOString();
  res.json(ordenes[idx]);
});

mainApp.delete('/api/ordenes/:id', (req, res) => {
  const idx = findIdx(ordenes, req.params.id);
  if (idx < 0) return notFound(res, 'Orden no encontrada');
  ordenes.splice(idx, 1);
  res.status(204).send();
});

// ─── REPUESTOS ───────────────────────────────────────────────────────────────

mainApp.get('/api/repuestos', (req, res) => {
  let result = [...repuestos];
  if (req.query.incluirInactivos !== 'true') result = result.filter(r => r.activo);
  if (req.query.critico === 'true') result = result.filter(r => r.critico);
  if (req.query.nombre)  result = result.filter(r => r.nombre.toLowerCase().includes(req.query.nombre.toLowerCase()));
  res.json(result);
});

mainApp.get('/api/repuestos/:id', (req, res) => {
  const r = repuestos.find(r => r.id === parseInt(req.params.id));
  if (!r) return notFound(res, 'Repuesto no encontrado');
  res.json(r);
});

mainApp.post('/api/repuestos', (req, res) => {
  const { nombre, categoria, precio, stockActual, stockMinimo, stockBajo } = req.body;
  const newR = {
    id: nextId(repuestos), nombre, categoria, precio,
    stockActual, stockMinimo, stockBajo,
    critico: stockActual === 0,
    bajo: stockActual > 0 && stockActual <= stockBajo,
    activo: true, createdAt: new Date().toISOString()
  };
  repuestos.push(newR);
  res.status(201).json(newR);
});

mainApp.put('/api/repuestos/:id', (req, res) => {
  const idx = findIdx(repuestos, req.params.id);
  if (idx < 0) return notFound(res, 'Repuesto no encontrado');
  const { nombre, categoria, precio, stockActual, stockMinimo, stockBajo } = req.body;
  repuestos[idx] = {
    ...repuestos[idx], nombre, categoria, precio, stockActual, stockMinimo, stockBajo,
    critico: stockActual === 0,
    bajo: stockActual > 0 && stockActual <= stockBajo,
  };
  res.json(repuestos[idx]);
});

mainApp.delete('/api/repuestos/:id', (req, res) => {
  const idx = findIdx(repuestos, req.params.id);
  if (idx < 0) return notFound(res, 'Repuesto no encontrado');
  repuestos[idx].activo = false;
  res.status(204).send();
});

mainApp.patch('/api/repuestos/:id/activar', (req, res) => {
  const idx = findIdx(repuestos, req.params.id);
  if (idx < 0) return notFound(res, 'Repuesto no encontrado');
  repuestos[idx].activo = true;
  res.status(204).send();
});

// ─── COBROS  (específicas antes de /:id) ────────────────────────────────────

mainApp.get('/api/cobros/caja-diaria', (req, res) => {
  const fecha = req.query.fecha || HOY.toISOString().split('T')[0];
  const delDia = cobros.filter(c => c.estadoPago === 'APROBADO' && c.createdAt.startsWith(fecha));
  res.json({
    fecha,
    totalDia:          delDia.reduce((s, c) => s + c.monto, 0),
    cantidadOrdenes:   delDia.length,
    totalEfectivo:     delDia.filter(c => c.medioPago === 'EFECTIVO').reduce((s, c) => s + c.monto, 0),
    totalTarjeta:      delDia.filter(c => c.medioPago === 'TARJETA').reduce((s, c) => s + c.monto, 0),
    totalMercadoPago:  delDia.filter(c => c.medioPago === 'MERCADOPAGO').reduce((s, c) => s + c.monto, 0),
    cobrosDelDia: delDia,
  });
});

mainApp.get('/api/cobros/historial', (req, res) => {
  const montosBase = [71500, 84200, 62800, 95300, 78600, 88900];
  const result = montosBase.map((total, i) => {
    const dt = new Date(HOY);
    dt.setMonth(dt.getMonth() - (5 - i));
    const fecha = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-15`;
    return {
      fecha, totalDia: total, cantidadOrdenes: 4 + (i % 3),
      totalEfectivo: Math.round(total * 0.4), totalTarjeta: Math.round(total * 0.35),
      totalMercadoPago: Math.round(total * 0.25), cobrosDelDia: [],
    };
  });
  res.json(result);
});

mainApp.get('/api/cobros/ordenes/:ordenId/presupuesto-pdf', (req, res) => {
  const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n217\n%%EOF';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="presupuesto-orden-${req.params.ordenId}.pdf"`);
  res.send(Buffer.from(pdf));
});

mainApp.get('/api/cobros/:id', (req, res) => {
  const c = cobros.find(c => c.id === parseInt(req.params.id));
  if (!c) return notFound(res, 'Cobro no encontrado');
  res.json(c);
});

mainApp.post('/api/cobros', (req, res) => {
  const { ordenId, monto, montoRecibido, medioPago } = req.body;
  const orden = ordenes.find(o => o.id === ordenId);
  const aprobado = medioPago !== 'MERCADOPAGO';
  const newCobro = {
    id: nextId(cobros), ordenId,
    clienteNombre: orden?.clienteNombre ?? 'Cliente',
    monto, montoRecibido: montoRecibido ?? null,
    vuelto: montoRecibido ? montoRecibido - monto : null,
    medioPago,
    estadoPago: aprobado ? 'APROBADO' : 'PENDIENTE',
    mpLinkPago: !aprobado ? 'https://mp.com/checkout/v1/redirect?pref_id=mock_123' : null,
    mpQrBase64: null, mpQrImageUrl: null,
    createdAt: new Date().toISOString(),
  };
  cobros.push(newCobro);
  if (aprobado) {
    const idx = findIdx(ordenes, ordenId);
    if (idx >= 0) { ordenes[idx].estado = 'ENTREGADO'; ordenes[idx].updatedAt = new Date().toISOString(); }
  }
  res.status(201).json(newCobro);
});

mainApp.post('/api/cobros/:cobroId/confirmar', (req, res) => {
  const idx = findIdx(cobros, req.params.cobroId);
  if (idx < 0) return notFound(res, 'Cobro no encontrado');
  cobros[idx].estadoPago = 'APROBADO';
  const oIdx = findIdx(ordenes, cobros[idx].ordenId);
  if (oIdx >= 0) { ordenes[oIdx].estado = 'ENTREGADO'; ordenes[oIdx].updatedAt = new Date().toISOString(); }
  res.json(cobros[idx]);
});

// ─── ALERTAS ────────────────────────────────────────────────────────────────

mainApp.get('/api/alertas/leidas', (req, res) => {
  const uid = String(getUserIdFromReq(req));
  res.json(alertasLeidas[uid] ?? []);
});

mainApp.post('/api/alertas/:alertaKey/leer', (req, res) => {
  const uid = String(getUserIdFromReq(req));
  if (!alertasLeidas[uid]) alertasLeidas[uid] = [];
  if (!alertasLeidas[uid].includes(req.params.alertaKey))
    alertasLeidas[uid].push(req.params.alertaKey);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS API  ─  PORT 8082
// ═══════════════════════════════════════════════════════════════════════════════

analyticsApp.get('/analytics/ordenes/resumen', (_, res) => {
  res.json({
    pendientes: ordenes.filter(o => o.estado === 'PENDIENTE').length,
    en_proceso: ordenes.filter(o => o.estado === 'EN_PROCESO').length,
    listas:     ordenes.filter(o => o.estado === 'LISTO').length,
    entregadas: ordenes.filter(o => o.estado === 'ENTREGADO').length,
    total:      ordenes.length,
  });
});

analyticsApp.get('/analytics/ordenes/por-periodo', (req, res) => {
  const agrupacion = req.query.agrupacion || 'mes';
  const meses = parseInt(req.query.meses_atras || '6');
  const cantidades = [4, 7, 5, 9, 6, 8, 3, 10, 7, 5, 8, 6];
  const result = [];
  if (agrupacion === 'mes') {
    for (let i = meses - 1; i >= 0; i--) {
      const dt = new Date(HOY);
      dt.setMonth(dt.getMonth() - i);
      result.push({ periodo: dt.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }), cantidad: cantidades[i] ?? 5 });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(HOY);
      dt.setDate(dt.getDate() - i * 7);
      result.push({ periodo: `Sem ${dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}`, cantidad: Math.floor(cantidades[i % cantidades.length] / 2) + 1 });
    }
  }
  res.json(result);
});

analyticsApp.get('/analytics/ordenes/tecnicos/rendimiento', (_, res) => {
  res.json([
    { tecnico_id: 2, nombre: 'Carlos Rodríguez', ordenes_cerradas: 8, tiempo_promedio_dias: 4.2 },
    { tecnico_id: 3, nombre: 'María González',   ordenes_cerradas: 6, tiempo_promedio_dias: 3.8 },
  ]);
});

analyticsApp.get('/analytics/ordenes/sin-movimiento', (req, res) => {
  const umbral = parseInt(req.query.dias_umbral || '5');
  const result = ordenes
    .filter(o => ['PENDIENTE', 'EN_PROCESO'].includes(o.estado))
    .map(o => ({ ...o, dias_sin_movimiento: Math.floor((HOY - new Date(o.updatedAt)) / 86400000) }))
    .filter(o => o.dias_sin_movimiento >= umbral);
  res.json(result);
});

analyticsApp.get('/analytics/ordenes/alta-prioridad', (req, res) => {
  const diasMin = parseInt(req.query.dias_minimos || '1');
  res.json(
    ordenes.filter(o => o.prioridad === 'ALTA' && ['PENDIENTE', 'EN_PROCESO'].includes(o.estado) &&
      Math.floor((HOY - new Date(o.createdAt)) / 86400000) >= diasMin)
  );
});

analyticsApp.get('/analytics/ordenes/tiempo-por-estado', (_, res) => {
  res.json([
    { estado: 'PENDIENTE',  tiempo_promedio_horas: 18.5 },
    { estado: 'EN_PROCESO', tiempo_promedio_horas: 72.3 },
    { estado: 'LISTO',      tiempo_promedio_horas: 36.1 },
  ]);
});

analyticsApp.get('/analytics/stock/critico', (_, res) => {
  res.json(
    repuestos.filter(r => r.activo && r.critico).map(r => ({
      id: r.id, nombre: r.nombre, categoria: r.categoria,
      stock_actual: r.stockActual, stock_minimo: r.stockMinimo,
      diferencia: r.stockMinimo - r.stockActual,
    }))
  );
});

analyticsApp.get('/analytics/stock/por-categoria', (_, res) => {
  const cats = {};
  repuestos.filter(r => r.activo).forEach(r => {
    const cat = r.categoria ?? 'Sin categoría';
    if (!cats[cat]) cats[cat] = { categoria: cat, cantidad: 0, valor_total: 0 };
    cats[cat].cantidad++;
    cats[cat].valor_total += r.precio * r.stockActual;
  });
  res.json(Object.values(cats));
});

analyticsApp.get('/analytics/caja/resumen-diario', (req, res) => {
  const fecha = req.query.fecha || HOY.toISOString().split('T')[0];
  res.json({
    fecha, total_ingresos: 41500, cantidad_cobros: 3,
    desglose: [
      { medio_pago: 'EFECTIVO',    total: 15000, cantidad: 1 },
      { medio_pago: 'TARJETA',     total: 17000, cantidad: 1 },
      { medio_pago: 'MERCADOPAGO', total: 9500,  cantidad: 1 },
    ],
  });
});

analyticsApp.get('/analytics/caja/evolucion-mensual', (req, res) => {
  const meses   = parseInt(req.query.meses || '6');
  const ingresos = [71500, 84200, 62800, 95300, 78600, 88900];
  const result  = [];
  for (let i = meses - 1; i >= 0; i--) {
    const dt = new Date(HOY);
    dt.setMonth(dt.getMonth() - i);
    result.push({
      mes: dt.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
      total_ingresos: ingresos[meses - 1 - i] ?? 75000,
      cantidad_cobros: 4 + ((meses - 1 - i) % 3),
    });
  }
  res.json(result);
});

analyticsApp.get('/analytics/caja/rechazos', (_, res) => {
  res.json({ cantidad_rechazos: 1, monto_rechazado: 0, porcentaje_rechazo: 2.5, rechazos: [] });
});

analyticsApp.get('/analytics/caja/conversion-presupuesto', (_, res) => {
  res.json({ total_presupuestado: 12, total_convertido: 10, tasa_conversion: 83.3, monto_presupuestado: 178000, monto_cobrado: 141500 });
});

analyticsApp.get('/analytics/clientes/recurrencia', (_, res) => {
  res.json([
    { cliente_id: 1, nombre: 'Juan Pérez',       cantidad_ordenes: 3, ultima_visita: daysAgo(7)  },
    { cliente_id: 2, nombre: 'Sofía Martínez',   cantidad_ordenes: 3, ultima_visita: daysAgo(4)  },
    { cliente_id: 4, nombre: 'Ana López',         cantidad_ordenes: 2, ultima_visita: daysAgo(2)  },
    { cliente_id: 3, nombre: 'Roberto Sánchez',  cantidad_ordenes: 2, ultima_visita: daysAgo(10) },
    { cliente_id: 6, nombre: 'Valentina Torres', cantidad_ordenes: 1, ultima_visita: daysAgo(12) },
    { cliente_id: 5, nombre: 'Diego Fernández',  cantidad_ordenes: 1, ultima_visita: daysAgo(1)  },
    { cliente_id: 7, nombre: 'Marcos Giménez',   cantidad_ordenes: 1, ultima_visita: daysAgo(1)  },
  ]);
});

analyticsApp.get('/analytics/alertas/activas', (_, res) => {
  const alertas = [];

  repuestos.filter(r => r.activo && r.critico).forEach(r => {
    alertas.push({
      key: `stock_critico_${r.id}`, tipo: 'stock_critico', nivel: 'critico',
      titulo: `Stock crítico: ${r.nombre}`,
      descripcion: `"${r.nombre}" tiene ${r.stockActual} unidades (mínimo requerido: ${r.stockMinimo}).`,
      datos: { repuesto_id: r.id, nombre: r.nombre, stock_actual: r.stockActual, stock_minimo: r.stockMinimo },
      createdAt: new Date().toISOString(),
    });
  });

  ordenes.filter(o => o.prioridad === 'ALTA' && o.estado === 'PENDIENTE' && !o.tecnicoId).forEach(o => {
    alertas.push({
      key: `orden_alta_sin_tecnico_${o.id}`, tipo: 'orden_sin_asignar', nivel: 'advertencia',
      titulo: `Orden #${o.id} de alta prioridad sin técnico`,
      descripcion: `La orden #${o.id} de ${o.clienteNombre} lleva ${Math.floor((HOY - new Date(o.createdAt)) / 86400000)} días sin ser asignada.`,
      datos: { orden_id: o.id, cliente: o.clienteNombre },
      createdAt: o.createdAt,
    });
  });

  repuestos.filter(r => r.activo && r.bajo && !r.critico).forEach(r => {
    alertas.push({
      key: `stock_bajo_${r.id}`, tipo: 'stock_bajo', nivel: 'informacion',
      titulo: `Stock bajo: ${r.nombre}`,
      descripcion: `"${r.nombre}" está por debajo del nivel recomendado (${r.stockActual}/${r.stockBajo} uds.).`,
      datos: { repuesto_id: r.id, nombre: r.nombre, stock_actual: r.stockActual, stock_bajo: r.stockBajo },
      createdAt: new Date().toISOString(),
    });
  });

  res.json(alertas);
});

analyticsApp.get('/analytics/alertas/resumen', (_, res) => {
  const criticos     = repuestos.filter(r => r.activo && r.critico).length;
  const advertencias = ordenes.filter(o => o.prioridad === 'ALTA' && o.estado === 'PENDIENTE' && !o.tecnicoId).length;
  const informaciones= repuestos.filter(r => r.activo && r.bajo && !r.critico).length;
  res.json({ total: criticos + advertencias + informaciones, criticos, advertencias, informaciones });
});

analyticsApp.post('/analytics/asistente/consulta', (req, res) => {
  const p = (req.body.pregunta || '').toLowerCase();
  let respuesta;

  if (p.includes('stock') || p.includes('repuesto') || p.includes('inventario')) {
    respuesta = 'Actualmente hay **3 repuestos en estado crítico** (stock en 0): el Conector Lightning iPhone, el Flex de volumen iPhone 12 y la Pantalla Samsung S22 Ultra. Además, hay 4 ítems con stock bajo. Se recomienda emitir una orden de compra urgente para los críticos.';
  } else if (p.includes('orden') || p.includes('trabajo') || p.includes('reparaci')) {
    respuesta = 'Hay **14 órdenes de trabajo** en el sistema: 3 pendientes de asignación, 4 en proceso, 2 listas para entregar, 4 entregadas y 1 cancelada. La orden #1 de Diego Fernández tiene prioridad ALTA y aún no tiene técnico asignado.';
  } else if (p.includes('caja') || p.includes('cobro') || p.includes('ingreso') || p.includes('dinero') || p.includes('factur')) {
    respuesta = 'El ingreso total de los últimos 6 meses fue de **$481.300**. El mejor mes fue mayo con **$95.300**. El medio de pago más utilizado es efectivo (40%), seguido por tarjeta (35%) y MercadoPago (25%). La tasa de conversión de presupuestos es del 83,3%.';
  } else if (p.includes('tecnico') || p.includes('técnico') || p.includes('rendimiento') || p.includes('desempe')) {
    respuesta = 'En el mes actual, **Carlos Rodríguez** cerró 8 órdenes con un tiempo promedio de 4,2 días, y **María González** cerró 6 órdenes con 3,8 días promedio, siendo más eficiente por orden. Se recomienda balancear mejor la carga entre ambos.';
  } else if (p.includes('cliente')) {
    respuesta = 'Hay **7 clientes activos** y 1 inactivo. Los más recurrentes son Juan Pérez y Sofía Martínez, con 3 órdenes cada uno. Ana López y Roberto Sánchez tienen 2 órdenes. Los demás tienen 1 orden registrada.';
  } else if (p.includes('prioridad') || p.includes('urgent')) {
    respuesta = 'Las tareas más urgentes hoy son: **1)** Asignar la orden #1 de Diego Fernández (pantalla partida, ALTA prioridad, sin técnico). **2)** Reponer stock de Conector Lightning y Flex de volumen iPhone 12 (en 0 unidades). **3)** Contactar a Valentina Torres cuya PC ya está lista para retirar (orden #8).';
  } else {
    respuesta = `Analicé tu consulta: "${req.body.pregunta}". Según los datos del taller: tenés **7 órdenes activas**, **3 repuestos críticos** y un ingreso promedio mensual de **$80.216**. Las órdenes #8 y #9 están listas para entregar. ¿Necesitás más detalle sobre alguna área?`;
  }

  res.json({
    respuesta,
    contexto_utilizado: {
      ordenes_activas: ordenes.filter(o => ['PENDIENTE', 'EN_PROCESO', 'LISTO'].includes(o.estado)).length,
      repuestos_criticos: repuestos.filter(r => r.critico && r.activo).length,
      ingresos_mes: 88900,
    },
  });
});

// ─── START ────────────────────────────────────────────────────────────────────

mainApp.listen(8081, () => {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║        TallerSoft  –  Backend simulado               ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  API Principal  →  http://localhost:8081             ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\n  Usuarios de prueba:');
  console.log('  ┌─────────────────────────────┬─────────────┬──────────┐');
  console.log('  │ Email                       │ Contraseña  │ Rol      │');
  console.log('  ├─────────────────────────────┼─────────────┼──────────┤');
  console.log('  │ admin@tallersoft.com        │ admin123    │ ADMIN    │');
  console.log('  │ carlos@tallersoft.com       │ tecnico123  │ TÉCNICO  │');
  console.log('  │ maria@tallersoft.com        │ tecnico123  │ TÉCNICO  │');
  console.log('  │ laura@tallersoft.com        │ recep123    │ RECEPCION│');
  console.log('  └─────────────────────────────┴─────────────┴──────────┘\n');
});

analyticsApp.listen(8082, () => {
  console.log('  API Analytics   →  http://localhost:8082\n');
});
