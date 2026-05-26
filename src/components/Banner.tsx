import React from 'react';
import { ShieldAlert, MapPin, User, LogOut, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { AdminUser, IncidentReport } from '../types';

interface BannerProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onOpenAdminLogin: () => void;
  activeTab: 'public' | 'admin';
  setActiveTab: (tab: 'public' | 'admin') => void;
  reports: IncidentReport[];
}

export default function Banner({
  adminUser,
  onLogout,
  onOpenAdminLogin,
  activeTab,
  setActiveTab,
  reports,
}: BannerProps) {
  // Compute metrics in real-time
  const total = reports.length;
  const active = reports.filter((r) => r.status !== 'Cerrado').length;
  const resolved = reports.filter((r) => r.status === 'Cerrado').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 shadow-sm sticky top-0 z-[1000]">
      {/* Upper bar: Brandsen Seal & Identification */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Seal and Title */}
        <div className="flex items-center gap-3.5">
          <img 
            src="https://www.brandsen.gob.ar/img/favicon/brandsen_logo-web.png" 
            alt="Logo Municipalidad de Brandsen" 
            className="w-11 h-11 object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="text-left flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[17px] md:text-xl font-black font-display tracking-tight text-slate-900 leading-none">
                ALERTA TEMPRANA
              </h1>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <span className="text-[11px] md:text-xs font-bold text-slate-500 tracking-wide mt-1 leading-none">
              Municipalidad de Brandsen
            </span>
          </div>
        </div>

        {/* Real-time Counters */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
          {/* Active indicator */}
          <div className="px-3 py-1 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-500" />
            <div className="text-left">
              <div className="text-[9px] text-slate-400 uppercase font-bold leading-none">Pendientes</div>
              <div className="text-xs font-black font-mono text-amber-700 leading-none mt-0.5">{active}</div>
            </div>
          </div>

          {/* Resolved indicator */}
          <div className="px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle size={13} className="text-emerald-500" />
            <div className="text-left">
              <div className="text-[9px] text-slate-400 uppercase font-bold leading-none">Resueltos</div>
              <div className="text-xs font-black font-mono text-emerald-700 leading-none mt-0.5">{resolved}</div>
            </div>
          </div>

          {/* Efficiency indicator */}
          <div className="px-3 py-1 bg-brand-50 rounded-xl border border-brand-100 hidden md:flex items-center gap-1.5">
            <Clock size={13} className="text-brand-500" />
            <div className="text-left">
              <div className="text-[9px] text-slate-400 uppercase font-bold leading-none">Resolución</div>
              <div className="text-xs font-black font-mono text-brand-700 leading-none mt-0.5">{resolutionRate}%</div>
            </div>
          </div>
        </div>

        {/* Admin actions or Session status */}
        <div className="flex items-center gap-3 text-sm">
          {adminUser.isAuthenticated ? (
            <div className="bg-brand-50 hover:bg-brand-100 border border-brand-200 p-1.5 pl-3 rounded-xl flex items-center gap-3 text-brand-900 transition-all shadow-xs">
              <div className="text-left">
                <div className="text-[9px] text-brand-700 leading-none font-extrabold uppercase tracking-wider">Sesión Activa</div>
                <div className="text-xs font-bold text-slate-700 leading-none mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                  {adminUser.username}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1 px-2.5 bg-red-500 hover:bg-red-600 font-bold active:scale-95 text-xs text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="Cerrar Panel"
              >
                <LogOut size={11} />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full active:scale-95 shadow-md hover:shadow-lg hover:shadow-slate-200 transition-all cursor-pointer"
            >
              <User size={13} />
              <span>Acceso Municipio</span>
            </button>
          )}
        </div>
      </div>

      {/* Lower Bar: Tabs Navigation */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-2 py-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex items-center gap-1.5 px-4 py-1.5 font-display text-xs md:text-sm font-bold rounded-full transition-all cursor-pointer ${
                activeTab === 'public'
                  ? 'bg-brand-600 text-white shadow shadow-brand-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <MapPin size={13} />
              <span>Incidencias de Vecinos</span>
            </button>

            {adminUser.isAuthenticated && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-4 py-1.5 font-display text-xs md:text-sm font-bold rounded-full transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-brand-600 text-white shadow shadow-brand-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <ShieldAlert size={13} />
                <span>Panel Municipal 🛠️</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
