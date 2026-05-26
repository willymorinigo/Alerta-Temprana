import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { IncidentReport, IncidentCategory, IncidentStatus } from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'reports-database.json');

app.use(express.json({ limit: '10mb' }));

// Initial mock data centered in Coronel Brandsen (-35.168, -58.232)
const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: "rep-1",
    category: "Luminaria rota",
    description: "Farola central de la cuadra parpadea constantemente y se apaga por las noches. Genera una zona muy oscura.",
    lat: -35.16782,
    lng: -58.23235,
    address: "San Martín 150 (e/ Rivadavia y Alberti)",
    locality: "Brandsen",
    status: "Reportado",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    neighborName: "María González",
    neighborPhone: "02223 44-5566",
    photoUrl: "https://images.unsplash.com/photo-1518364538800-6bcb3f25da49?w=600&auto=format&fit=crop&q=60",
    internalComments: []
  },
  {
    id: "rep-2",
    category: "Bache",
    description: "Bache profundo de casi 2 metros de ancho justo antes de llegar a la intersección con la Ruta 215. Los autos deben realizar maniobras peligrosas.",
    lat: -35.0664,
    lng: -58.3846,
    address: "Intersección Acceso Gómez",
    locality: "Gómez",
    status: "En Revisión",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    neighborName: "Juan Pérez",
    neighborPhone: "02223 15-9988",
    photoUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=60",
    internalComments: ["Asignado a personal de vialidad para inspección inicial."]
  },
  {
    id: "rep-3",
    category: "Árbol caído",
    description: "Rama de gran porte del plátano se quebró por la última tormenta y obstruye la vereda en las inmediaciones de la estación ferroviaria Jeppener.",
    lat: -35.2758,
    lng: -58.1965,
    address: "Avenida San Martín, Estación Jeppener",
    locality: "Jeppener",
    status: "En Cuadrilla",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    neighborName: "Estela Maris",
    neighborPhone: "02223 41-2345",
    photoUrl: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&auto=format&fit=crop&q=60",
    internalComments: ["Cuadrilla de poda y arbolado fue despachada con motosierras.", "La zona ya se encuentra balizada parcialmente."]
  },
  {
    id: "rep-4",
    category: "Cable cortado",
    description: "Cable de media tensión colgando muy bajo por rozar un pino. Representa un riesgo inminente en la zona rural de Altamirano.",
    lat: -35.3411,
    lng: -58.1472,
    address: "Acceso Altamirano, Altamirano",
    locality: "Altamirano",
    status: "Reportado",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    neighborName: "Carlos Spinetta",
    neighborPhone: "011 15-5555-8811",
    photoUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=60",
    internalComments: []
  },
  {
    id: "rep-5",
    category: "Residuos especiales",
    description: "Acumulación de escombros de obra y restos de poda de particulares arrojados sobre el acceso a Samborombón. Obstruye escurrimiento fluvial.",
    lat: -35.1950,
    lng: -58.1054,
    address: "Calle Los Ombúes, Barrio Samborombón",
    locality: "Samborombón",
    status: "Cerrado",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    neighborName: "Patricia Bull",
    neighborPhone: "02223 49-8811",
    photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=60",
    internalComments: ["Se notificó al propietario infractor.", "Pala mecánica municipal realizó la recolección integral de los residuos."]
  }
];

// Helper to read database
function readDatabase(): IncidentReport[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_REPORTS, null, 2), 'utf8');
      return INITIAL_REPORTS;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading reports database:', err);
    return INITIAL_REPORTS;
  }
}

// Helper to write database
function writeDatabase(data: IncidentReport[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing reports database:', err);
  }
}

// API Routes
// 1. Get all reports with optional filters
app.get('/api/reports', (req, res) => {
  const reports = readDatabase();
  const { status, category, query, locality } = req.query;

  let filtered = [...reports];

  if (status && status !== 'Todos') {
    filtered = filtered.filter(r => r.status === status);
  }

  if (category && category !== 'Todas') {
    filtered = filtered.filter(r => r.category === category);
  }

  if (locality && locality !== 'Todas') {
    filtered = filtered.filter(r => r.locality === locality);
  }

  if (query) {
    const q = (query as string).toLowerCase();
    filtered = filtered.filter(r => 
      r.description.toLowerCase().includes(q) || 
      r.address.toLowerCase().includes(q) || 
      r.id.toLowerCase().includes(q) ||
      (r.locality && r.locality.toLowerCase().includes(q)) ||
      (r.neighborName && r.neighborName.toLowerCase().includes(q))
    );
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

// 2. Create a new incident report (Neighbor Front)
app.post('/api/reports', (req, res) => {
  try {
    const { category, description, lat, lng, address, neighborName, neighborPhone, photoUrl, locality } = req.body;

    if (!category || !description || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para generar el reporte.' });
    }

    const newReport: IncidentReport = {
      id: `rep-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      description,
      lat: Number(lat),
      lng: Number(lng),
      address: address || 'Dirección no especificada',
      locality: locality || 'Brandsen',
      status: 'Reportado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      neighborName: neighborName || 'Anónimo',
      neighborPhone: neighborPhone || '',
      photoUrl: photoUrl || undefined,
      internalComments: []
    };

    const database = readDatabase();
    database.push(newReport);
    writeDatabase(database);

    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Hubo una falla interna al guardar tu reporte.' });
  }
});

// 3. Update report status / Add resolution notes (Admin dashboard)
app.put('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, internalComment } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Se requiere especificar un estado.' });
    }

    const database = readDatabase();
    const index = database.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'No se encontró el reporte especificado.' });
    }

    const currentReport = database[index];
    currentReport.status = status as IncidentStatus;
    currentReport.updatedAt = new Date().toISOString();

    if (internalComment && internalComment.trim() !== '') {
      currentReport.internalComments = currentReport.internalComments || [];
      currentReport.internalComments.push(internalComment.trim());
    }

    database[index] = currentReport;
    writeDatabase(database);

    res.json(currentReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Falla interna al actualizar los datos.' });
  }
});

// 4. Get municipal statistics for KPIs
app.get('/api/stats', (req, res) => {
  const database = readDatabase();
  
  const stats = {
    total: database.length,
    byStatus: {
      'Reportado': database.filter(r => r.status === 'Reportado').length,
      'En Revisión': database.filter(r => r.status === 'En Revisión').length,
      'En Cuadrilla': database.filter(r => r.status === 'En Cuadrilla').length,
      'Cerrado': database.filter(r => r.status === 'Cerrado').length,
    },
    byCategory: {
      'Luminaria rota': database.filter(r => r.category === 'Luminaria rota').length,
      'Bache': database.filter(r => r.category === 'Bache').length,
      'Árbol caído': database.filter(r => r.category === 'Árbol caído').length,
      'Cable cortado': database.filter(r => r.category === 'Cable cortado').length,
      'Residuos especiales': database.filter(r => r.category === 'Residuos especiales').length,
      'Otro': database.filter(r => r.category === 'Otro').length,
    }
  };

  res.json(stats);
});

// 5. Simulate Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simulation secret credentials for the user
  if (username === 'admin' && password === 'brandsen2026') {
    res.json({
      success: true,
      username: 'admin',
      role: 'Coordinador General de Servicios',
      token: 'simulated-security-token-brandsen'
    });
  } else {
    res.status(401).json({ success: false, error: 'Credenciales inválidas. Inicie con usuario "admin" y clave "brandsen2026".' });
  }
});

// 6. Geographic database and components blueprint definition for educational delivery
app.get('/api/architectural-specs', (req, res) => {
  res.json({
    databaseSchema: {
      type: "Relational (PostgreSQL with PostGIS extensions) or Document (MongoDB with Geospatial Indexes)",
      recommendedStack: {
        frontend: "React, Vite, Tailwind CSS, Leaflet/OpenStreetMap",
        backend: "Node.js (Express) with TypeScript, serving REST Endpoints",
        database: "PostgreSQL + PostGIS (Industry standard for precision routing & geofencing)"
      },
      schemaDesign: [
        {
          tableName: "incidencias (incidents)",
          fields: [
            { name: "id", type: "UUID / SERIAL", constraint: "PRIMARY KEY", desc: "Identificador único incremental del reporte" },
            { name: "categoria", type: "VARCHAR(50)", constraint: "NOT NULL", desc: "Categoría de la incidencia (Luminaria, Poda, Bache, etc.)" },
            { name: "descripcion", type: "TEXT", constraint: "NOT NULL", desc: "Explicación breve provista por el vecino" },
            { name: "posicion_gps", type: "GEOMETRY(Point, 4326)", constraint: "NOT NULL", desc: "Ubicación espacial usando latitud y longitud georreferenciada" },
            { name: "latitud", type: "NUMERIC(10, 8)", constraint: "NOT NULL", desc: "Respaldo numérico tradicional de Latitud" },
            { name: "longitud", type: "NUMERIC(11, 8)", constraint: "NOT NULL", desc: "Respaldo numérico tradicional de Longitud" },
            { name: "direccion_aproximada", type: "VARCHAR(255)", constraint: "NULL", desc: "Dirección postal deducida por geocodificación inversa" },
            { name: "estado", type: "VARCHAR(30)", constraint: "DEFAULT 'Reportado'", desc: "Ciclo de vida: Reportado, En Revisión, En Cuadrilla, Cerrado" },
            { name: "imagen_url", type: "VARCHAR(512)", constraint: "NULL", desc: "Dirección de almacenamiento S3/Cloudinary de la foto adjunta" },
            { name: "vecino_nombre", type: "VARCHAR(100)", constraint: "DEFAULT 'Anónimo'", desc: "Nombre opcional del emisor" },
            { name: "vecino_contacto", type: "VARCHAR(50)", constraint: "NULL", desc: "Celular o correo de contacto para alertas de progreso" },
            { name: "comentarios_internos", type: "TEXT[]", constraint: "DEFAULT '{}'", desc: "Historial de notas del personal municipal de cuadrilla" },
            { name: "fecha_creacion", type: "TIMESTAMP", constraint: "DEFAULT NOW()", desc: "Momento exacto del registro de entrada" },
            { name: "fecha_actualizacion", type: "TIMESTAMP", constraint: "DEFAULT NOW()", desc: "Último cambio de estado o acción registrada" }
          ]
        },
        {
          tableName: "usuarios_municipio (admins)",
          fields: [
            { name: "username", type: "VARCHAR(50)", constraint: "PRIMARY KEY", desc: "Código/usuario de acceso" },
            { name: "digest_clave", type: "VARCHAR(255)", constraint: "NOT NULL", desc: "Contraseña hasheada (PBKDF2/bcrypt)" },
            { name: "rol", type: "VARCHAR(50)", constraint: "NOT NULL", desc: "Rol de operación (Operador, Supervisor, Administrador)" },
            { name: "sector", type: "VARCHAR(100)", constraint: "NOT NULL", desc: "Dirección de pertenencia (Obras Públicas, Iluminación, Espacios Verdes)" }
          ]
        }
      ],
      postgisQueryExample: `
-- Búsqueda de incidencias críticas activas en un radio de 500 metros
-- de las coordenadas dadas en Coronel Brandsen
SELECT id, categoria, descripcion, direccion_aproximada,
       ST_Distance(posicion_gps, ST_SetSRID(ST_Point(-58.23235, -35.16782), 4326)::geography) AS distancia_metros
FROM incidencias
WHERE estado != 'Cerrado'
  AND ST_DWithin(posicion_gps, ST_SetSRID(ST_Point(-58.23235, -35.16782), 4326)::geography, 500)
ORDER BY distancia_metros ASC;
      `
    }
  });
});

// Vite & Static assets router setup
async function init() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Brandsen Alerta Temprana Full-Stack Node Server listening on port ${PORT}`);
  });
}

init();
