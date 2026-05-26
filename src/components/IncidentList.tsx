import React, { useState } from 'react';
import { IncidentReport, IncidentCategory, IncidentStatus, IncidentFilters } from '../types';
import { Search, MapPin, Calendar, Clock, Lock, CheckCircle2, MessageSquare, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface IncidentListProps {
  reports: IncidentReport[];
  selectedReport: IncidentReport | null;
  onSelectReport: (report: IncidentReport) => void;
  filters: IncidentFilters;
  onChangeFilters: (filters: IncidentFilters) => void;
}

export default function IncidentList({
  reports,
  selectedReport,
  onSelectReport,
  filters,
  onChangeFilters,
}: IncidentListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories: (IncidentCategory | 'Todas')[] = [
    'Todas',
    'Luminaria rota',
    'Bache',
    'Árbol caído',
    'Cable cortado',
    'Residuos especiales',
    'Otro',
  ];

  const statuses: (IncidentStatus | 'Todos')[] = [
    'Todos',
    'Reportado',
    'En Revisión',
    'En Cuadrilla',
    'Cerrado',
  ];

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'Reportado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Reportado
          </span>
        );
      case 'En Revisión':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            En Revisión
          </span>
        );
      case 'En Cuadrilla':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            En Cuadrilla
          </span>
        );
      case 'Cerrado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Resuelto
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryEmoji = (cat: IncidentCategory) => {
    switch (cat) {
      case 'Luminaria rota': return '💡';
      case 'Bache': return '🕳️';
      case 'Árbol caído': return '🌳';
      case 'Cable cortado': return '⚡';
      case 'Residuos especiales': return '🗑️';
      default: return '⚠️';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-full gap-4">
      {/* Search and Filters Header */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold font-display text-slate-900 flex items-center justify-between">
          <span>Reclamos Recientes de la Comunidad</span>
          <span className="text-xs bg-slate-100 font-mono text-slate-500 font-bold px-2 py-0.5 rounded-md">
            {reports.length} en grilla
          </span>
        </h3>

        {/* Name query search field */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por dirección, reclamo o ID..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChangeFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white placeholder-slate-400"
          />
        </div>

        {/* Triple Filter Selectors */}
        <div className="grid grid-cols-3 gap-2">
          {/* Locality Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Zona</span>
            <select
              value={filters.locality || 'Todas'}
              onChange={(e) => onChangeFilters({ ...filters, locality: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 font-medium focus:outline-none"
            >
              <option value="Todas">🏡 Todo Partido</option>
              <option value="Brandsen">Brandsen</option>
              <option value="Gómez">Gómez</option>
              <option value="Jeppener">Jeppener</option>
              <option value="Altamirano">Altamirano</option>
              <option value="Samborombón">Samborombón</option>
              <option value="Oliden">Oliden</option>
              <option value="Las Acacias">Las Acacias</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Servicio</span>
            <select
              value={filters.category}
              onChange={(e) => onChangeFilters({ ...filters, category: e.target.value as IncidentCategory | 'Todas' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 font-medium focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Todas' ? '📂 Todos' : `${getCategoryEmoji(cat as IncidentCategory)} ${cat.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Estado</span>
            <select
              value={filters.status}
              onChange={(e) => onChangeFilters({ ...filters, status: e.target.value as IncidentStatus | 'Todos' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 font-medium focus:outline-none"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st === 'Todos' ? '🚦 Todos' : st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid List (scrollable) */}
      <div className="space-y-3 overflow-y-auto max-h-[350px] md:max-h-[500px] pr-1">
        {reports.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-1">
            <div className="text-2xl">🔍</div>
            <p className="text-xs font-semibold">No se encontraron reclamos con esos filtros.</p>
            <p className="text-[10px] text-slate-400">Intentá ampliar criterios o iniciá un nuevo aviso!</p>
          </div>
        ) : (
          reports.map((report) => {
            const isSelected = selectedReport?.id === report.id;
            const isExpanded = expandedId === report.id;
            const dateStr = new Date(report.createdAt).toLocaleDateString();

            return (
              <div
                key={report.id}
                onClick={() => onSelectReport(report)}
                className={`group rounded-xl border p-3.5 transition-all cursor-pointer text-left relative ${
                  isSelected
                    ? 'bg-brand-50/40 border-brand-300 shadow-md ring-1 ring-brand-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* ID and Status Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                      ID: {report.id}
                    </span>
                    {report.locality && (
                      <span className="text-[9px] bg-brand-50 text-brand-700 font-extrabold px-1.5 py-0.5 rounded-full border border-brand-200">
                        📍 {report.locality}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-slate-800 font-display flex items-center gap-1">
                      {getCategoryEmoji(report.category)} {report.category}
                    </span>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                {/* Subtext info */}
                <p className="text-xs text-slate-600 mt-2 font-medium line-clamp-2">
                  {report.description}
                </p>

                {/* Address row */}
                <div className="flex flex-col gap-1 mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 font-medium text-slate-500">
                    <MapPin size={11} className="text-indigo-500" />
                    <span className="truncate">{report.address}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      <span>Reporte: {dateStr}</span>
                    </div>
                    
                    {report.neighborName && (
                      <span className="text-[9px] text-slate-400 font-medium">Vecino: {report.neighborName}</span>
                    )}
                  </div>
                </div>

                {/* Image and Resolution log details (Expanded View) */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-slideDown">
                    {/* Incident photo if exists */}
                    {report.photoUrl && (
                      <div className="relative rounded-lg overflow-hidden border border-slate-100 h-36 bg-slate-100">
                        <img
                          src={report.photoUrl}
                          alt={report.category}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-black/70 to-black/30 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider backdrop-blur-xs">
                          Evidencia del Siniestro
                        </div>
                      </div>
                    )}

                    {/* Timeline of internal resolutions */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <MessageSquare size={10} className="text-brand-600" />
                        <span>Historial / Nota del Municipio</span>
                      </h4>
                      
                      {report.internalComments && report.internalComments.length > 0 ? (
                        <div className="space-y-1.5 PL-1">
                          {report.internalComments.map((com, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 border border-slate-100 flex items-start gap-1.5">
                              <span className="text-brand-600 font-bold">✔️</span>
                              <span>{com}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-400 text-center italic border border-slate-100">
                          Sin comentarios internos cargados aún. El aviso está bajo evaluación de cuadrillas.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Accordion action bars */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/60">
                  <span className="text-[10px] text-brand-600 font-semibold group-hover:underline flex items-center gap-0.5">
                    Centrar en mapa ➔
                  </span>
                  
                  <button
                    onClick={(e) => toggleExpand(report.id, e)}
                    className="flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-900 bg-slate-100 border border-slate-200/50 hover:bg-slate-200 px-2 py-1 rounded transition-colors font-semibold"
                  >
                    <span>{isExpanded ? 'Ver menos' : 'Detalles de cuadrilla'}</span>
                    {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
