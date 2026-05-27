import React, { useEffect, useState, useCallback } from 'react';
import { IncidentReport, IncidentStatus, IncidentCategory, IncidentFilters, AdminUser } from './types';
import Banner from './components/Banner';
import MapComponent from './components/MapComponent';
import ReportForm from './components/ReportForm';
import IncidentList from './components/IncidentList';
import AdminPanel from './components/AdminPanel';
import { PlusCircle, HelpCircle, MapPin, CheckCircle2, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { getApiUrl } from './api';

export default function App() {
  // Global claims state
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);

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
      const queryParams = new URLSearchParams();
      if (filters.status !== 'Todos') queryParams.append('status', filters.status);
      if (filters.category !== 'Todas') queryParams.append('category', filters.category);
      if (filters.locality && filters.locality !== 'Todas') queryParams.append('locality', filters.locality);
      if (filters.searchQuery) queryParams.append('query', filters.searchQuery);

      const resp = await fetch(getApiUrl(`/api/reports?${queryParams.toString()}`));
      if (resp.ok) {
        const data = await resp.json();
        setReports(data);
        
        // Auto-select first loaded report to center map if none is selected yet
        if (data.length > 0 && !selectedReport) {
          setSelectedReport(data[0]);
        }
      }
    } catch (err) {
      console.error('Error connecting to Brandsen API server:', err);
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
    const resp = await fetch(getApiUrl('/api/reports'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (resp.ok) {
      const newReport = await resp.json();
      
      // Add report to state list immediately, disable reporting mode, reset pins
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
      setReportLocation(null);
      setIsReportingMode(false);
      
      // Open success notifications
      setSuccessSubmissionBanner(true);
      setTimeout(() => setSuccessSubmissionBanner(false), 5000);
    } else {
      let errorMessage = 'No se pudo registrar la incidencia.';
      try {
        const errorData = await resp.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Error del servidor (${resp.status}): El servidor no devolvió una respuesta válida. Si tu sesión expiró o estás navegando en un navegador con cookies de terceros bloqueadas, por favor recargá la página o permití las cookies.`;
      }
      throw new Error(errorMessage);
    }
  };

  // Update incident status from the Admin Control Tower
  const handleUpdateReportStatus = async (id: string, newStatus: IncidentStatus, comment: string) => {
    const resp = await fetch(getApiUrl(`/api/reports/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, internalComment: comment }),
    });

    if (resp.ok) {
      const updated = await resp.json();
      
      // Update reports list state
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSelectedReport(updated);
    } else {
      let errorMessage = 'No se pudo procesar la actualización.';
      try {
        const errorData = await resp.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Error del servidor (${resp.status}): No se pudo procesar la respuesta del servidor.`;
      }
      throw new Error(errorMessage);
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
        
        {/* Success submission notification popup */}
        {successSubmissionBanner && (
          <div className="p-5 bg-brand-600 text-white rounded-3xl flex items-center gap-3 shadow-md animate-slideDown max-w-4xl mx-auto border border-brand-500 font-medium">
            <span className="text-xl">🙌</span>
            <div className="text-left text-xs md:text-sm">
              <strong className="block font-bold font-display text-white">¡Reporte Enviado al Municipio de Brandsen!</strong>
              <span className="text-brand-100">Tu reporte ya está georreferenciado e ingresó al sistema de cuadrillas municipales. ¡Gracias por colaborar!</span>
            </div>
          </div>
        )}

        {/* Main interactive grid and panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT / CENTER COLUMN: Geographic Map (Spans 7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Main Map Box Header styling */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <div>
                  <h2 className="text-lg md:text-xl font-bold font-display text-slate-900 flex items-center gap-1.5">
                    <span>Mapa de Alerta Temprana</span>
                    <span className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-200/50">
                      C. Brandsen
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 leading-tight">
                    Hacé clic en cualquier punto del mapa para fijar una incidencia urbana.
                  </p>
                </div>

                {!isReportingMode && (
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
                        address: `Centro de ${userLoc}, Partido de Coronel Brandsen`,
                      });
                    }}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow hover:shadow-md flex items-center gap-2 self-start sm:self-auto active:scale-95 cursor-pointer"
                  >
                    <PlusCircle size={14} />
                    <span>Reportar Incidencia</span>
                  </button>
                )}
              </div>

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

              {/* Informative footer helper */}
              <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-start gap-4 text-left shadow-lg">
                <HelpCircle size={20} className="text-brand-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white font-display">¿Cómo funciona la Alerta Temprana de Servicios?</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Los reportes vecinales agilizan la detección de luminarias rotas, baches peligrosos, ramas caídas o cables colgantes. Los inspectores gestionan la respuesta directamente en sus dispositivos y las cuadrillas operativas actualizan el estado a la comunidad de forma transparente.
                  </p>
                </div>
              </div>
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
                <IncidentList
                  reports={reports}
                  selectedReport={selectedReport}
                  onSelectReport={setSelectedReport}
                  filters={filters}
                  onChangeFilters={setFilters}
                />
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
