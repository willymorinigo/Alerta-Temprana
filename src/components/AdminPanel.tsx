import React, { useState, useEffect } from 'react';
import { AdminUser, IncidentReport, IncidentStatus } from '../types';
import { Lock, FileText, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, MessageSquare, PlusCircle, Activity, Lightbulb, Users, Search } from 'lucide-react';

interface AdminPanelProps {
  adminUser: AdminUser;
  reports: IncidentReport[];
  selectedReport: IncidentReport | null;
  onLoginSuccess: (user: AdminUser) => void;
  onUpdateReportStatus: (id: string, newStatus: IncidentStatus, comment: string) => Promise<void>;
}

export default function AdminPanel({
  adminUser,
  reports,
  selectedReport,
  onLoginSuccess,
  onUpdateReportStatus,
}: AdminPanelProps) {
  // Login credentials states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Resolution states
  const [updatedStatus, setUpdatedStatus] = useState<IncidentStatus>('Reportado');
  const [internalComment, setInternalComment] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Sub-tabs state inside the authenticated backend
  const [adminSubTab, setAdminSubTab] = useState<'claims' | 'neighbors'>('claims');
  const [neighborFilter, setNeighborFilter] = useState('');

  // Initial list of citizens registered / verified in the app
  const [neighbors, setNeighbors] = useState(() => {
    const initialList = [
      { name: "María González", dni: "28.341.652", phone: "02223 44-5566", locality: "Brandsen", status: "Autenticado (SMS)", reports: 1 },
      { name: "Juan Pérez", dni: "30.154.998", phone: "02223 15-9988", locality: "Gómez", status: "Autenticado (SMS)", reports: 1 },
      { name: "Estela Maris", dni: "22.991.643", phone: "02223 41-2345", locality: "Jeppener", status: "Autenticado (SMS)", reports: 1 },
      { name: "Carlos Spinetta", dni: "35.881.002", phone: "011 15-5555-8811", locality: "Altamirano", status: "Autenticado (SMS)", reports: 1 },
      { name: "Patricia Bull", dni: "24.551.902", phone: "02223 49-8811", locality: "Samborombón", status: "Autenticado (SMS)", reports: 1 },
    ];
    
    try {
      const saved = localStorage.getItem('brandsen_neighbor_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.verified) {
          if (!initialList.some(n => n.dni === parsed.dni)) {
            initialList.unshift({
              name: parsed.name,
              dni: parsed.dni,
              phone: parsed.phone,
              locality: parsed.locality,
              status: "Autenticado (SMS)",
              reports: 1
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialList;
  });

  // Sync session neighbors in real-time when sub-tab transitions
  useEffect(() => {
    try {
      const saved = localStorage.getItem('brandsen_neighbor_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.verified) {
          setNeighbors(prev => {
            if (!prev.some(n => n.dni === parsed.dni)) {
              return [{
                name: parsed.name,
                dni: parsed.dni,
                phone: parsed.phone,
                locality: parsed.locality,
                status: "Autenticado (SMS)",
                reports: 1
              }, ...prev];
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [adminSubTab]);

  // Synchronize local status indicator as selected report moves
  useEffect(() => {
    if (selectedReport) {
      setUpdatedStatus(selectedReport.status);
      setInternalComment('');
      setUpdateSuccess(false);
    }
  }, [selectedReport]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        onLoginSuccess({
          username: resData.username,
          role: resData.role,
          isAuthenticated: true,
        });
      } else {
        setLoginError(resData.error || 'Credenciales inválidas.');
      }
    } catch (err) {
      setLoginError('Error de red al autenticar.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setUpdateLoading(true);
      setUpdateSuccess(false);
      await onUpdateReportStatus(selectedReport.id, updatedStatus, internalComment);
      setUpdateSuccess(true);
      setInternalComment('');
      
      // Auto-clear success banner after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Group metrics calculations for admin board indicators
  const stats = {
    total: reports.length,
    reportado: reports.filter((r) => r.status === 'Reportado').length,
    revision: reports.filter((r) => r.status === 'En Revisión').length,
    cuadrilla: reports.filter((r) => r.status === 'En Cuadrilla').length,
    cerrado: reports.filter((r) => r.status === 'Cerrado').length,
  };

  // Filter neighbors based on search box input
  const filteredNeighbors = neighbors.filter(n => {
    const q = neighborFilter.toLowerCase();
    return (
      n.name.toLowerCase().includes(q) ||
      n.dni.toLowerCase().includes(q) ||
      n.locality.toLowerCase().includes(q)
    );
  });

  // If municipal operator is not logged in, show elegant login screen
  if (!adminUser.isAuthenticated) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto border border-brand-100">
            <Lock size={22} className="animate-pulse" />
          </div>
          <h3 className="text-xl font-bold font-display text-slate-800">Ingreso de Operador Municipal</h3>
          <p className="text-xs text-slate-500">
            Sección restringida para la intendencia y cuadrilla de Coronel Brandsen.
          </p>
        </div>

        {loginError && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 font-semibold text-xs rounded-xl text-center">
            ⚠️ {loginError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Usuario Admin</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 font-display active:scale-95 text-white py-2.5 rounded-full font-bold text-xs transition-all shadow-md hover:shadow-lg hover:shadow-slate-200 disabled:opacity-55 cursor-pointer"
          >
            {loginLoading ? 'Iniciando sesión...' : 'Entrar al Control de Servicios'}
          </button>
        </form>

        {/* Demo Helper Panel with preconfigured passwords */}
        <div className="bg-brand-50 rounded-2xl p-3.5 text-[11px] border border-brand-100 text-brand-800 space-y-1 leading-relaxed">
          <div className="font-bold flex items-center gap-1">
            <Lightbulb size={12} />
            <span>Credenciales de Testeo (Prueba Rápida):</span>
          </div>
          <div>
            • <strong>Usuario:</strong> <code className="bg-white/60 px-1 py-0.2 rounded select-all font-mono">admin</code>
          </div>
          <div>
            • <strong>Contraseña:</strong> <code className="bg-white/60 px-1 py-0.2 rounded select-all font-mono">brandsen2026</code>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard main panel
  return (
    <div className="space-y-5 text-left">
      
      {/* Sub-tab Navigation for high-end organization (De-cluttering the UI) */}
      <div className="flex border-b border-slate-200 gap-2 mb-2 bg-slate-100/60 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setAdminSubTab('claims')}
          className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            adminSubTab === 'claims'
              ? 'bg-white text-brand-700 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-850 hover:bg-white/40'
          }`}
        >
          <Activity size={15} />
          <span>Gestión de Reclamos ({stats.total})</span>
        </button>
        <button
          type="button"
          onClick={() => setAdminSubTab('neighbors')}
          className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            adminSubTab === 'neighbors'
              ? 'bg-white text-brand-700 shadow-xs border border-slate-200'
              : 'text-slate-500 hover:text-slate-850 hover:bg-white/40'
          }`}
        >
          <Users size={15} />
          <span>Base de Datos de Vecinos ({neighbors.length})</span>
        </button>
      </div>

      {adminSubTab === 'claims' ? (
        <div className="space-y-6">
          {/* Upper overview stats grids */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* KPI 1 */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-3.5 text-left flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-lg">
                <Activity size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Recibidos</div>
                <div className="text-xl font-black text-slate-900 font-mono">{stats.total}</div>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-3.5 text-left flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sin Asignar</div>
                <div className="text-xl font-black text-slate-900 font-mono">{stats.reportado}</div>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-3.5 text-left flex items-center gap-3">
              <div className="p-2.5 bg-brand-50 text-brand-600 rounded-lg">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">En Cuadrilla</div>
                <div className="text-xl font-black text-slate-900 font-mono">{stats.cuadrilla}</div>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-3.5 text-left flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cerrados Ok</div>
                <div className="text-xl font-black text-slate-900 font-mono">{stats.cerrado}</div>
              </div>
            </div>
          </div>

          {/* Main Admin Controller */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-slate-805 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <span className="p-1 bg-brand-50 text-brand-700 rounded-lg"><UserCheck size={16} /></span>
              <span>Despacho y Actualización de Reclamos en Tiempo Real</span>
            </h3>

            {selectedReport ? (
              <form onSubmit={handleUpdateStatusSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Col: Selected Report details preview */}
                <div className="space-y-3.5 border-r border-slate-100 pr-0 md:pr-6 text-left">
                  <div>
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded font-mono text-slate-500 font-bold">
                      ID: {selectedReport.id}
                    </span>
                    <h4 className="text-base font-bold font-display text-slate-900 mt-1 flex items-center gap-1.5">
                      <span>{selectedReport.category}</span>
                    </h4>
                  </div>

                  <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 leading-relaxed font-medium">
                    <div>
                      <strong className="text-slate-800 font-bold">Ubicación física:</strong>
                      <p className="font-sans text-slate-600 font-normal">{selectedReport.address}</p>
                    </div>
                    <div>
                      <strong className="text-slate-800 font-bold">Resumen del vecino:</strong>
                      <p className="text-slate-500 italic font-normal">"{selectedReport.description}"</p>
                    </div>
                    {selectedReport.neighborName && (
                      <div className="pt-1.5 border-t border-slate-200/60 mt-1.5 text-[11px] grid grid-cols-2 gap-2 text-slate-400">
                        <span>Vecino: <strong className="text-slate-500">{selectedReport.neighborName}</strong></span>
                        {selectedReport.neighborPhone && (
                          <span>Tel: <strong className="text-slate-500">{selectedReport.neighborPhone}</strong></span>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedReport.photoUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
                      <img src={selectedReport.photoUrl} alt="Reporte" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Right Col: Change status and add comments */}
                <div className="space-y-4 text-left">
                  {updateSuccess && (
                    <div className="p-3 bg-brand-50 text-brand-850 text-xs rounded-xl border border-brand-200 font-semibold">
                      ✔️ Reporte actualizado correctamente. Se sincronizó el mapa público.
                    </div>
                  )}

                  {/* Status Selector */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest leading-none">
                      Cambiar Estado Operativo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Reportado', 'En Revisión', 'En Cuadrilla', 'Cerrado'] as IncidentStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setUpdatedStatus(st)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                            updatedStatus === st
                              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          {st === 'Cerrado' ? '✅ Cerrado / Resuelto' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* internal Resolution Comment input */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest leading-none flex justify-between items-center">
                      <span>Agregar Nota Interna / Acciones del Municipio</span>
                      <span className="text-[9px] text-slate-400 lowercase font-normal">(Visible para el vecino)</span>
                    </label>
                    <textarea
                      value={internalComment}
                      onChange={(e) => setInternalComment(e.target.value)}
                      placeholder="Ej: 'Cuadrilla de alumbrado inspeccionó y cambió el balasto dañado a las 14:00hs.'"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white min-h-[75px]"
                    />
                  </div>

                  {/* Action buttons */}
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="w-full bg-brand-600 hover:bg-brand-700 font-display active:scale-95 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-brand-100 hover:shadow-lg hover:shadow-brand-300 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Sincronizar Cambios 🔄</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <div className="text-3xl">🗺️</div>
                <p className="text-xs font-semibold text-slate-600">Ningún reclamo seleccionado para gestionar.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Hacé un clic sobre cualquier pin en el mapa de Brandsen o seleccioná una fila de la lista de incidencias para empezar la gestión.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Base de datos de Vecinos Tab (As requested: table with verified neighbors and their data in the backend) */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 block md:flex md:items-center md:justify-between space-y-2 md:space-y-0 text-left">
            <div>
              <h3 className="text-base font-bold font-display text-slate-805 flex items-center gap-2">
                <span className="p-1 bg-emerald-50 text-emerald-700 rounded-lg"><Users size={16} /></span>
                <span>Padrón de Vecinos Activos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Fichero del padrón ciudadano con identidades validadas por PIN SMS de Alerta Temprana.
              </p>
            </div>

            {/* In-tab contextual Search utility */}
            <div className="relative w-full md:w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o zona..."
                value={neighborFilter}
                onChange={(e) => setNeighborFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-500 focus:bg-white text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-450 uppercase text-[9px] font-bold tracking-wider">
                  <th className="px-4 py-2.5">Vecino / Contribuyente</th>
                  <th className="px-4 py-2.5">DNI</th>
                  <th className="px-4 py-2.5">Celular</th>
                  <th className="px-4 py-2.5">Localidad</th>
                  <th className="px-4 py-2.5">Estado Canal</th>
                  <th className="px-4 py-2.5 text-center">Incidencias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredNeighbors.length > 0 ? (
                  filteredNeighbors.map((n, index) => (
                    <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{n.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{n.dni}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{n.phone}</td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-700 font-bold border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                          {n.locality}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full px-2 py-0.5 text-[9px] font-extrabold inline-flex items-center gap-0.5">
                          <CheckCircle2 size={9} /> {n.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-brand-600">{n.reports}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      ⚠️ No se encontraron vecinos con los filtros provistos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Compliance informational card */}
          <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100/80 text-[11px] leading-snug flex items-start gap-2 text-brand-900 font-medium">
            <ShieldCheck size={16} className="text-brand-600 mt-0.5 shrink-0" />
            <div>
              <strong className="block text-brand-950 font-bold mb-0.5">Base Protegida de Identidades Municipales</strong>
              Esta nómina representa la bitácora activa de usuarios que se registraron mediante la firma del PIN temporal SMS de 4 dígitos. Se preservan según ordenanza de protección de datos personales de la Municipalidad de Coronel Brandsen.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
