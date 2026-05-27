import React, { useState } from 'react';
import { IncidentReport, IncidentStatus, IncidentCategory } from '../types';
import { Search, MapPin, Calendar, Clock, Eye, AlertCircle, CheckCircle, MessageSquare, Image, Filter, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AdminClaimsTableProps {
  reports: IncidentReport[];
  selectedReport: IncidentReport | null;
  onSelectReport: (report: IncidentReport) => void;
}

const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'Luminaria rota': return '💡';
    case 'Bache': return '🚧';
    case 'Árbol caído': return '🌳';
    case 'Cable cortado': return '⚡';
    case 'Residuos especiales': return '🗑️';
    default: return '⚠️';
  }
};

const getStatusBadgeClass = (status: IncidentStatus) => {
  switch (status) {
    case 'Reportado':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'En Revisión':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'En Cuadrilla':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Cerrado':
      return 'bg-emerald-50 text-emerald-700 border-emerald-250';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export default function AdminClaimsTable({
  reports,
  selectedReport,
  onSelectReport,
}: AdminClaimsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Activos' | 'Resueltos' | 'Todos'>('Activos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [localityFilter, setLocalityFilter] = useState<string>('Todas');

  // Available unique localities and categories from the dataset
  const localities = ['Todas', 'Brandsen', 'Gómez', 'Jeppener', 'Altamirano', 'Samborombón', 'Oliden', 'Las Acacias'];
  const categories = ['Todas', 'Luminaria rota', 'Bache', 'Árbol caído', 'Cable cortado', 'Residuos especiales', 'Otro'];

  // Filter the report list based on search and parameters
  const filteredReports = reports.filter((r) => {
    // 1. Status Filter
    if (statusFilter === 'Activos' && r.status === 'Cerrado') return false;
    if (statusFilter === 'Resueltos' && r.status !== 'Cerrado') return false;

    // 2. Category Filter
    if (categoryFilter !== 'Todas' && r.category !== categoryFilter) return false;

    // 3. Locality Filter
    if (localityFilter !== 'Todas' && r.locality !== localityFilter) return false;

    // 4. Search text matches ID, address, description, neighbor details
    const textStr = `${r.id} ${r.category} ${r.address} ${r.description} ${r.neighborName || ''} ${r.neighborPhone || ''}`.toLowerCase();
    return textStr.includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Header strip
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 297, 25, 'F');

    // Title / branding
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MUNICIPALIDAD DE CORONEL BRANDSEN', 15, 11);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Portal de Alerta Temprana de Servicios Públicos - Resumen de Mesa de Entrada', 15, 17);

    // Date and filter title
    const dateFormatted = new Date().toLocaleString('es-AR');
    doc.setFontSize(9);
    doc.text(`Fecha de emisión: ${dateFormatted}`, 282, 11, { align: 'right' });
    doc.text(`Filtro de Estado: ${statusFilter.toUpperCase()}`, 282, 17, { align: 'right' });

    // Subheader summary
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Mesa de Gestión - Zona: ${localityFilter} | Categoría: ${categoryFilter}`, 15, 35);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total de reclamos listados: ${filteredReports.length}`, 15, 41);

    // Table settings
    const colX = {
      id: 15,
      fecha: 35,
      categoria: 65,
      ubicacion: 110,
      vecino: 170,
      detalle: 215,
      estado: 260
    };

    // Drawing Table Header backgrounds
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(15, 46, 267, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate-600

    doc.text('ID', colX.id + 2, 51.5);
    doc.text('Fecha', colX.fecha, 51.5);
    doc.text('Categoría', colX.categoria, 51.5);
    doc.text('Ubicación / Zona', colX.ubicacion, 51.5);
    doc.text('Vecino', colX.vecino, 51.5);
    doc.text('Detalle', colX.detalle, 51.5);
    doc.text('Estado', colX.estado, 51.5);

    let currentY = 54;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    filteredReports.forEach((report) => {
      // Manage pagination for landscape A4 (height is 210mm)
      if (currentY > 185) {
        doc.addPage();
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 297, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('MUNICIPALIDAD DE CORONEL BRANDSEN - Reporte de Reclamos (Continuación)', 15, 9);
        
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 20, 267, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);

        doc.text('ID', colX.id + 2, 25.5);
        doc.text('Fecha', colX.fecha, 25.5);
        doc.text('Categoría', colX.categoria, 25.5);
        doc.text('Ubicación / Zona', colX.ubicacion, 25.5);
        doc.text('Vecino', colX.vecino, 25.5);
        doc.text('Detalle', colX.detalle, 25.5);
        doc.text('Estado', colX.estado, 25.5);

        currentY = 28;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      currentY += 7.5;

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.12);
      doc.line(15, currentY, 282, currentY);

      const cellY = currentY - 2.5;
      doc.setTextColor(15, 23, 42); // slate-900

      // Column data writing block
      // ID
      const displayId = report.id.substring(0, 9).toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.text(displayId, colX.id + 2, cellY);
      doc.setFont('helvetica', 'normal');

      // Date
      const dateString = formatDate(report.createdAt);
      doc.text(dateString.split(',')[0] || dateString, colX.fecha, cellY);

      // Category
      doc.text(report.category, colX.categoria, cellY);

      // Location
      let locText = report.address;
      if (report.locality) locText += ` - ${report.locality}`;
      if (locText.length > 35) locText = locText.substring(0, 33) + '...';
      doc.text(locText, colX.ubicacion, cellY);

      // Neighbor Name
      let neighborText = report.neighborName || 'Anónimo';
      if (report.neighborPhone) neighborText += ` (${report.neighborPhone})`;
      if (neighborText.length > 25) neighborText = neighborText.substring(0, 23) + '...';
      doc.text(neighborText, colX.vecino, cellY);

      // Detail description
      let commentText = report.description || '';
      if (commentText.length > 30) commentText = commentText.substring(0, 28) + '...';
      doc.text(commentText, colX.detalle, cellY);

      // Status coloration
      const statusText = report.status;
      if (statusText === 'Cerrado') {
        doc.setTextColor(22, 101, 52); // green-800
      } else if (statusText === 'En Cuadrilla') {
        doc.setTextColor(29, 78, 216); // blue-700
      } else if (statusText === 'En Revisión') {
        doc.setTextColor(180, 83, 9); // amber-700
      } else {
        doc.setTextColor(185, 28, 28); // red-700
      }
      doc.setFont('helvetica', 'bold');
      doc.text(statusText, colX.estado, cellY);
      doc.setFont('helvetica', 'normal');
    });

    const filename = `Reporte_MesaControl_${statusFilter}_${new Date().toISOString().substring(0,10)}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 text-left">
      {/* Header and explanation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
            <span className="p-1 bg-brand-50 text-brand-700 rounded-lg">📋</span>
            <span>Panel General de Control y Despacho Operativo</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Visualización integrada de todos los reclamos vigentes. Seleccioná una fila para gestionarla e iniciar acciones directamente.
          </p>
        </div>

        {/* Tab Filters and PDF download */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-start lg:self-auto w-full sm:w-auto">
          {/* Tab Filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setStatusFilter('Activos')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === 'Activos'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-850'
              }`}
            >
              ⚠️ Activos ({reports.filter(r => r.status !== 'Cerrado').length})
            </button>
            <button
              onClick={() => setStatusFilter('Resueltos')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === 'Resueltos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-850'
              }`}
            >
              ✅ Resueltos ({reports.filter(r => r.status === 'Cerrado').length})
            </button>
            <button
              onClick={() => setStatusFilter('Todos')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === 'Todos'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-850'
              }`}
            >
              Todos ({reports.length})
            </button>
          </div>

          {/* Download PDF button */}
          <button
            onClick={exportToPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#595959] hover:bg-zinc-600 active:scale-95 text-white border border-[#000000] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
            title="Descargar reporte formal en formato PDF"
          >
            <Download size={13} />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Advanced Search and Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-5 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID, dirección, vecino, detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-3 flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Filtro:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-brand-500 text-slate-700"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'Todas' ? 'Todas las Categorías' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Locality Filter */}
        <div className="md:col-span-4 flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Zona:</span>
          <select
            value={localityFilter}
            onChange={(e) => setLocalityFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-brand-500 text-slate-700"
          >
            {localities.map(l => (
              <option key={l} value={l}>
                {l === 'Todas' ? 'Todas las Zonas' : l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Layout */}
      <div className="overflow-x-auto rounded-2xl border border-slate-150 shadow-inner bg-slate-50/20 max-h-[380px] overflow-y-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 uppercase text-[9px] font-bold tracking-wider z-10 shadow-xs">
            <tr>
              <th className="px-4 py-3">Código ID / Fecha</th>
              <th className="px-4 py-3">Problema / Categoría</th>
              <th className="px-4 py-3">Ubicación / Zona</th>
              <th className="px-4 py-3">Vecino Beneficiario</th>
              <th className="px-4 py-3">Detalle Ciudadano</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-650 bg-white">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                return (
                  <tr
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className={`group hover:bg-slate-50/80 transition-all cursor-pointer ${
                      isSelected ? 'bg-brand-50/50 border-l-4 border-l-brand-600 font-medium' : ''
                    }`}
                  >
                    {/* ID / Fecha */}
                    <td className="px-4 py-3.5 space-y-1">
                      <div className="font-mono text-[10px] font-bold text-slate-700">
                        {report.id.substring(0, 11)}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                        <Calendar size={11} />
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                    </td>

                    {/* Category Title with Emoji */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-805">
                        <span>{getCategoryEmoji(report.category)}</span>
                        <span>{report.category}</span>
                      </div>
                    </td>

                    {/* Address & Locality */}
                    <td className="px-4 py-3.5 space-y-1 max-w-[200px]">
                      <div className="font-semibold text-slate-800 line-clamp-1">{report.address}</div>
                      {report.locality && (
                        <span className="inline-block bg-slate-100 text-slate-700 font-extrabold text-[9px] px-1.5 py-0.2 rounded border border-slate-200">
                          📍 {report.locality}
                        </span>
                      )}
                    </td>

                    {/* Neighbor Info */}
                    <td className="px-4 py-3.5 space-y-1">
                      <div className="font-bold text-slate-800">
                        {report.neighborName || 'Anónimo'}
                      </div>
                      {report.neighborPhone && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          📞 {report.neighborPhone}
                        </div>
                      )}
                    </td>

                    {/* Comment snippet */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="text-slate-500 italic line-clamp-2 leading-relaxed">
                        "{report.description}"
                      </div>
                      <div className="flex gap-2.5 mt-1">
                        {report.photoUrl && (
                          <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1 py-0.2 rounded border border-purple-200 flex items-center gap-0.5">
                            <Image size={9} /> Con Foto
                          </span>
                        )}
                        {report.internalComments && report.internalComments.length > 0 && (
                          <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-200 flex items-center gap-0.5">
                            <MessageSquare size={9} /> {report.internalComments.length} Notas
                          </span>
                        )}
                      </div>
                    </td>

                    {/* State badge */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  <div className="text-2xl mb-1.5">📋</div>
                  <p className="text-xs text-slate-600 font-bold mb-0.5">Sin reclamos con los filtros seleccionados</p>
                  <p className="text-[10px] text-slate-400">Tratá de cambiar el estado, localidad o borrá la búsqueda activa.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
