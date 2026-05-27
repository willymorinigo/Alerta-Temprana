import React, { useEffect, useState, useCallback } from 'react';
import { IncidentReport, IncidentStatus, IncidentCategory, IncidentFilters, AdminUser } from './types';
import Banner from './components/Banner';
import MapComponent from './components/MapComponent';
import ReportForm from './components/ReportForm';
import IncidentList from './components/IncidentList';
import AdminPanel from './components/AdminPanel';
import AdminClaimsTable from './components/AdminClaimsTable';
import { PlusCircle, HelpCircle, MapPin, CheckCircle2, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { getApiUrl } from './api';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const FALLBACK_REPORTS: IncidentReport[] = [
  {
    id: "rep-1",
    category: "Luminaria rota",
    description: "Farola central de la cuadra parpadea constantemente y se apaga por las noches. Genera una zona muy oscura.",
    lat: -35.16782,
    lng: -58.23235,
    address: "San Martín 150 (e/ Rivadavia y Alberti)",
    locality: "Brandsen",
    status: "Reportado",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    neighborName: "Patricia Bull",
    neighborPhone: "02223 49-8811",
    photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=60",
    internalComments: ["Se notificó al propietario infractor.", "Pala mecánica municipal realizó la recolección integral de los residuos."]
  }
];

export default function App() {
  // Global claims state
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Focus and placement state
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isReportingMode, setIsReportingMode] = useState(false);

  // Multi-view navigation tabs
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');

  // Admin session authentication state
  const [adminUser, setAdminUser] = useState<AdminUser>({
    username: '',
    role: '',
    isAuthenticated: false,
  });

  // Citizen neighbor validation state
  const [neighborSession, setNeighborSession] = useState<{
    name: string;
    dni: string;
    phone: string;
    locality: string;
    verified: boolean;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('brandsen_neighbor_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persist neighbor session
  useEffect(() => {
    if (neighborSession) {
      localStorage.setItem('brandsen_neighbor_session', JSON.stringify(neighborSession));
    } else {
      localStorage.removeItem('brandsen_neighbor_session');
    }
  }, [neighborSession]);

  // Firebase auth state synchronizer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = user.email || '';
        const role = email === 'willymorinigo@gmail.com'
          ? 'Coordinador General de Servicios (Master)'
          : 'Coordinador Municipal Autenticado (Vía Firebase)';
        setAdminUser({
          username: user.displayName || email.split('@')[0] || 'admin',
          role: role,
          isAuthenticated: true,
        });
      } else {
        // Prevent clearing the simulated admin if mock admin is logged in (keeps backwards compatibility)
        setAdminUser(prev => {
          if (prev.isAuthenticated && !prev.username.includes('(Vía Firebase)') && !prev.username.includes('(Master)')) {
            return prev;
          }
          return {
            username: '',
            role: '',
            isAuthenticated: false,
          };
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Neighbor search filter criteria
  const [filters, setFilters] = useState<IncidentFilters>({
    status: 'Todos',
    category: 'Todas',
    locality: 'Todas',
    searchQuery: '',
  });

  // Succesful submission banner feedback
  const [successSubmissionBanner, setSuccessSubmissionBanner] = useState(false);

  // Fetch reports from Express server database mapping endpoint
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      
      // Retrieve reports directly from Cloud Firestore
      const reportsCollection = collection(db, 'reports');
      const snapshot = await getDocs(reportsCollection);
      
      let data: IncidentReport[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() } as IncidentReport);
      });
      
      // Auto-populate default mock incidents if database is initialized for the first time
      if (data.length === 0) {
        console.log('Iniciando base de datos Firestore por primera vez...');
        for (const report of FALLBACK_REPORTS) {
          const docRef = doc(db, 'reports', report.id);
          await setDoc(docRef, report);
        }
        data = [...FALLBACK_REPORTS];
      }

      // Sort by newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply filters locally in real-time
      let filtered = [...data];
      if (filters.status !== 'Todos') {
        filtered = filtered.filter(r => r.status === filters.status);
      }
      if (filters.category !== 'Todas') {
        filtered = filtered.filter(r => r.category === filters.category);
      }
      if (filters.locality && filters.locality !== 'Todas') {
        filtered = filtered.filter(r => r.locality === filters.locality);
      }
      if (filters.searchQuery) {
        const queryStr = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
          r.description.toLowerCase().includes(queryStr) || 
          r.category.toLowerCase().includes(queryStr) || 
          (r.address && r.address.toLowerCase().includes(queryStr)) ||
          (r.locality && r.locality.toLowerCase().includes(queryStr))
        );
      }
      
      setReports(filtered);
      setIsOfflineMode(false);
      localStorage.setItem('brandsen_reports_cache', JSON.stringify(data));
      
      if (filtered.length > 0 && !selectedReport) {
        setSelectedReport(filtered[0]);
      }
    } catch (err: any) {
      console.warn('Fallo de conexión directa a Firebase Firestore o reglas bloqueantes. Usando demo local offline:', err);
      setIsOfflineMode(true);
      
      // Load fallback from localStorage cache or use hardcoded sample data
      const cached = localStorage.getItem('brandsen_reports_cache');
      let localData: IncidentReport[] = [];
      if (cached) {
        try {
          localData = JSON.parse(cached);
        } catch {
          localData = FALLBACK_REPORTS;
        }
      } else {
        localData = FALLBACK_REPORTS;
      }
      
      // Sort by newest first
      localData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply filters locally in localStorage mode to maintain perfect UX on Vercel
      let filtered = [...localData];
      if (filters.status !== 'Todos') {
        filtered = filtered.filter(r => r.status === filters.status);
      }
      if (filters.category !== 'Todas') {
        filtered = filtered.filter(r => r.category === filters.category);
      }
      if (filters.locality && filters.locality !== 'Todas') {
        filtered = filtered.filter(r => r.locality === filters.locality);
      }
      if (filters.searchQuery) {
        const queryStr = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
          r.description.toLowerCase().includes(queryStr) || 
          r.category.toLowerCase().includes(queryStr) || 
          (r.address && r.address.toLowerCase().includes(queryStr)) ||
          r.locality.toLowerCase().includes(queryStr)
        );
      }
      
      setReports(filtered);
      if (filtered.length > 0 && !selectedReport) {
        setSelectedReport(filtered[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, selectedReport]);

  // Load claims on mount or filter change
  useEffect(() => {
    fetchReports();
  }, [filters]);

  // Handle new reports submitted by nearby citizens
  const handleCreateReport = async (data: {
    category: IncidentCategory;
    description: string;
    lat: number;
    lng: number;
    address: string;
    neighborName?: string;
    neighborPhone?: string;
    photoUrl?: string;
    locality?: string;
  }) => {
    try {
      const generatedId = `rep-${Date.now()}`;
      const newReport: IncidentReport = {
        id: generatedId,
        category: data.category,
        description: data.description,
        lat: Number(data.lat),
        lng: Number(data.lng),
        address: data.address || 'Dirección no especificada',
        locality: data.locality || 'Brandsen',
        status: 'Reportado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        neighborName: data.neighborName || 'Vecino Anónimo',
        neighborPhone: data.neighborPhone || '',
        photoUrl: data.photoUrl || undefined,
        internalComments: []
      };

      // Direct write to Cloud Firestore
      try {
        const docRef = doc(db, 'reports', generatedId);
        await setDoc(docRef, newReport);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `reports/${generatedId}`);
      }

      // Add report to state list immediately, disable reporting mode, reset pins
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
      setReportLocation(null);
      setIsReportingMode(false);
      
      // Back up to cache
      try {
        const cached = localStorage.getItem('brandsen_reports_cache');
        const currentList = cached ? JSON.parse(cached) : [];
        localStorage.setItem('brandsen_reports_cache', JSON.stringify([newReport, ...currentList]));
      } catch (e) {
        console.warn('Error archiving to cache:', e);
      }

      // Open success notifications
      setSuccessSubmissionBanner(true);
      setTimeout(() => setSuccessSubmissionBanner(false), 5000);
    } catch (err) {
      console.warn('Iniciando fallback local para creación de reporte por fallo de conexión/CORS:', err);
      // Simulate successful creation locally!
      const newReport: IncidentReport = {
        id: `rep-${Date.now()}`,
        category: data.category,
        description: data.description,
        lat: data.lat,
        lng: data.lng,
        address: data.address,
        locality: data.locality || 'Brandsen',
        status: 'Reportado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        neighborName: data.neighborName || 'Vecino Anónimo',
        neighborPhone: data.neighborPhone || '',
        photoUrl: data.photoUrl,
        internalComments: []
      };

      // Set state locally
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
      setReportLocation(null);
      setIsReportingMode(false);
      setIsOfflineMode(true);

      // Save list to localStorage cache so it persists on reload!
      try {
        const cached = localStorage.getItem('brandsen_reports_cache');
        let currentList = cached ? JSON.parse(cached) : [];
        if (!currentList || !Array.isArray(currentList) || currentList.length === 0) {
          currentList = [newReport];
        } else {
          currentList.unshift(newReport);
        }
        localStorage.setItem('brandsen_reports_cache', JSON.stringify(currentList));
      } catch (e) {
        console.warn('Error saving to cache:', e);
      }

      // Open success notifications
      setSuccessSubmissionBanner(true);
      setTimeout(() => setSuccessSubmissionBanner(false), 5000);
    }
  };

  // Update incident status from the Admin Control Tower
  const handleUpdateReportStatus = async (id: string, newStatus: IncidentStatus, comment: string) => {
    try {
      const matchedReport = reports.find(r => r.id === id);
      const currentComments = matchedReport?.internalComments || [];
      const updatedComments = comment ? [...currentComments, comment] : currentComments;

      const updatedReport: IncidentReport = {
        ...(matchedReport || {} as IncidentReport),
        id,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        internalComments: updatedComments
      };

      // Update directly in Cloud Firestore
      try {
        const docRef = doc(db, 'reports', id);
        await updateDoc(docRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          internalComments: updatedComments
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `reports/${id}`);
      }
      
      // Update reports list state
      setReports((prev) => prev.map((r) => (r.id === id ? updatedReport : r)));
      setSelectedReport(updatedReport);

      // Update in localStorage cache
      try {
        const cached = localStorage.getItem('brandsen_reports_cache');
        if (cached) {
          const currentList: IncidentReport[] = JSON.parse(cached);
          const updatedList = currentList.map(r => r.id === id ? updatedReport : r);
          localStorage.setItem('brandsen_reports_cache', JSON.stringify(updatedList));
        }
      } catch (e) {
        console.warn('Error updating cache:', e);
      }
    } catch (err) {
      console.warn('Iniciando fallback local para actualización de reporte por fallo de conexión/CORS:', err);
      
      // Update locally!
      setReports((prev) => prev.map((r) => {
        if (r.id === id) {
          const comments = r.internalComments || [];
          const updatedComments = comment ? [...comments, comment] : comments;
          return {
            ...r,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            internalComments: updatedComments
          };
        }
        return r;
      }));
      
      // Also update chosen selection
      setSelectedReport((prev) => {
        if (prev && prev.id === id) {
          const comments = prev.internalComments || [];
          const updatedComments = comment ? [...comments, comment] : comments;
          return {
            ...prev,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            internalComments: updatedComments
          };
        }
        return prev;
      });

      // Persist in local storage
      try {
        const cached = localStorage.getItem('brandsen_reports_cache');
        if (cached) {
          const currentList: IncidentReport[] = JSON.parse(cached);
          const updatedList = currentList.map(r => {
            if (r.id === id) {
              const comments = r.internalComments || [];
              const updatedComments = comment ? [...comments, comment] : comments;
              return {
                ...r,
                status: newStatus,
                updatedAt: new Date().toISOString(),
                internalComments: updatedComments
              };
            }
            return r;
          });
          localStorage.setItem('brandsen_reports_cache', JSON.stringify(updatedList));
        }
      } catch (e) {
        console.warn('Error updating cache:', e);
      }
      setIsOfflineMode(true);
    }
  };

  const handleAdminLogout = () => {
    setAdminUser({
      username: '',
      role: '',
      isAuthenticated: false,
    });
    setActiveTab('public');
  };

  const handleOpenAdminLogin = () => {
    setActiveTab('admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. Header Navigation Banner */}
      <Banner
        adminUser={adminUser}
        onLogout={handleAdminLogout}
        onOpenAdminLogin={handleOpenAdminLogin}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'public') {
            setIsReportingMode(false);
            setReportLocation(null);
          }
        }}
        reports={reports}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Connection warning / demo mode warning */}
        {isOfflineMode && (
          <div className="p-4 bg-amber-50 text-amber-905 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm border border-amber-200 animate-slideDown">
            <div className="flex items-start gap-2.5 text-left text-xs">
              <span className="text-lg shrink-0">⚡</span>
              <div>
                <strong className="font-bold text-amber-950 block">Modo Demostración Activo (Bases de Datos Locales)</strong>
                <span className="text-amber-800">
                  No se pudo conectar con el servidor de desarrollo seguro (CORS / Cookies de terceros bloqueadas en Vercel). Se activó el almacenamiento local (localStorage) para que puedas crear, filtrar y responder reportes de manera fluida ahora mismo en tu navegador.
                </span>
              </div>
            </div>
            <a 
              href="https://ais-pre-vkktzhgjrqovrhkdd2bsx6-342678855823.us-east1.run.app" 
              target="_blank" 
              rel="noreferrer"
              className="text-[11px] font-black bg-amber-200 hover:bg-amber-300 text-amber-950 px-3.5 py-1.5 rounded-xl transition-all self-start md:self-auto shrink-0 text-center"
            >
              Probar Versión Sincronizada →
            </a>
          </div>
        )}

        {/* Success submission notification popup */}
        {successSubmissionBanner && (
          <div className="p-5 bg-brand-600 text-white rounded-3xl flex items-center gap-3 shadow-md animate-slideDown max-w-4xl mx-auto border border-brand-500 font-medium">
            <span className="text-xl">🙌</span>
            <div className="text-left text-xs md:text-sm">
              <strong className="block font-bold font-display text-white">¡Reporte Enviado al Municipio de Brandsen!</strong>
              <span className="text-brand-100">
                {isOfflineMode 
                  ? 'Tu reporte fue persistido localmente de forma segura en este navegador (Modo Demostración). ¡Gracias por colaborar!'
                  : 'Tu reporte ya está georreferenciado e ingresó al sistema de cuadrillas municipales. ¡Gracias por colaborar!'}
              </span>
            </div>
          </div>
        )}

        {/* Main interactive grid and panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT / CENTER COLUMN: Geographic Map (Spans 7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {activeTab === 'admin' && adminUser.isAuthenticated && (
                <AdminClaimsTable
                  reports={reports}
                  selectedReport={selectedReport}
                  onSelectReport={setSelectedReport}
                />
              )}
              
              {/* Informative helper ABOVE the map */}
              {!(activeTab === 'admin' && adminUser.isAuthenticated) && (
                <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-start gap-4 text-left shadow-lg animate-fadeIn">
                  <HelpCircle size={20} className="text-brand-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white font-display">¿Cómo funciona la Alerta Temprana de Servicios?</h4>
                    <p className="text-xs text-slate-305 leading-relaxed">
                      Los reportes vecinales agilizan la detección de luminarias rotas, baches peligrosos, ramas caídas o cables colgantes. Los inspectores gestionan la respuesta directamente en sus dispositivos y las cuadrillas operativas actualizan el estado a la comunidad de forma transparente.
                    </p>
                  </div>
                </div>
              )}

              {/* Leaflet interactive board */}
              <MapComponent
                reports={reports}
                selectedReport={selectedReport}
                onSelectReport={setSelectedReport}
                reportLocation={reportLocation}
                onSetReportLocation={(loc) => {
                  setReportLocation(loc);
                  setIsReportingMode(true);
                }}
                isReportingMode={isReportingMode}
                isNeighborVerified={!!neighborSession?.verified}
              />
            </div>

            {/* RIGHT SIDEBAR COLUMN: contextual actions (Spans 5 de 12 Cols) */}
            <div className="lg:col-span-5 h-full space-y-4">
              
              {/* Conditional Rendering: Neighbors reporting node vs Public searches vs Admin control panel */}
              {isReportingMode && activeTab === 'public' ? (
                <ReportForm
                  reportLocation={reportLocation}
                  onSubmitReport={handleCreateReport}
                  onCancel={() => {
                    setIsReportingMode(false);
                    setReportLocation(null);
                  }}
                  onSetReportLocation={setReportLocation}
                  neighborSession={neighborSession}
                  onVerifyNeighbor={(sess) => setNeighborSession(sess)}
                  onLogoutNeighbor={() => setNeighborSession(null)}
                />
              ) : activeTab === 'admin' ? (
                <AdminPanel
                  adminUser={adminUser}
                  reports={reports}
                  selectedReport={selectedReport}
                  onLoginSuccess={(user) => setAdminUser(user)}
                  onUpdateReportStatus={handleUpdateReportStatus}
                />
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  {/* Reporting incident option ABOVE the recent claims list */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-brand-50 text-brand-700 rounded-2xl border border-brand-100 shrink-0 mt-0.5">
                        <PlusCircle size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>Mapa de Alerta Temprana</span>
                          <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-200/50">
                            C. Brandsen
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                          Hacé clic en cualquier punto del mapa para fijar una incidencia urbana o presioná el botón de abajo para ingresar un nuevo reporte detallado.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const LOCALITY_COORDS: { [key: string]: { lat: number; lng: number } } = {
                          'Brandsen': { lat: -35.1685, lng: -58.2323 },
                          'Gómez': { lat: -35.0664, lng: -58.3846 },
                          'Jeppener': { lat: -35.2758, lng: -58.1965 },
                          'Altamirano': { lat: -35.3411, lng: -58.1472 },
                          'Samborombón': { lat: -35.1950, lng: -58.1054 },
                          'Oliden': { lat: -35.1542, lng: -57.9408 },
                          'Las Acacias': { lat: -35.1995, lng: -58.2580 }
                        };
                        const userLoc = neighborSession?.locality || 'Brandsen';
                        const coords = LOCALITY_COORDS[userLoc] || LOCALITY_COORDS['Brandsen'];
                        setIsReportingMode(true);
                        setReportLocation({
                          lat: coords.lat,
                          lng: coords.lng,
                          text: `Centro de ${userLoc}, Partido de Coronel Brandsen`,
                          address: `Centro de ${userLoc}, Partido de Coronel Brandsen`,
                        });
                      }}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      <span>Reportar Incidencia</span>
                    </button>
                  </div>

                  <IncidentList
                    reports={reports}
                    selectedReport={selectedReport}
                    onSelectReport={setSelectedReport}
                    filters={filters}
                    onChangeFilters={setFilters}
                  />
                </div>
              )}
            </div>
          </div>
      </main>

      {/* 3. Footer branding section */}
      <footer className="bg-slate-900 text-slate-500 text-center py-6 border-t border-slate-800 text-xs mt-12 space-y-1">
        <p className="font-semibold text-slate-400">
          📍 Portal Coordinador Municipal de Alerta Temprana de Servicios
        </p>
        <p className="text-[10px] text-slate-500">
          Intendencia de Coronel Brandsen, Provincia de Buenos Aires, República Argentina. {new Date().getFullYear()} • Versión Pública Estable
        </p>
      </footer>
    </div>
  );
}
