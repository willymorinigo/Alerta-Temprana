import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { IncidentReport, IncidentStatus } from '../types';
import { MapPin, Info, ArrowRight, UserCheck, PhoneCall, Calendar } from 'lucide-react';

interface MapComponentProps {
  reports: IncidentReport[];
  selectedReport: IncidentReport | null;
  onSelectReport: (report: IncidentReport) => void;
  reportLocation: { lat: number; lng: number } | null;
  onSetReportLocation: (loc: { lat: number; lng: number; address: string }) => void;
  isReportingMode: boolean;
  isNeighborVerified?: boolean;
}

export default function MapComponent({
  reports,
  selectedReport,
  onSelectReport,
  reportLocation,
  onSetReportLocation,
  isReportingMode,
  isNeighborVerified = false,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentPinMarkerRef = useRef<L.Marker | null>(null);
  const incidentMarkersMapRef = useRef<{ [key: string]: L.Marker }>({});

  const BRANDS_LAT = -35.1685;
  const BRANDS_LNG = -58.2323;

  // Persistent callback refs to avoid recreating map on state changes
  const onSetReportLocationRef = useRef(onSetReportLocation);
  const onSelectReportRef = useRef(onSelectReport);

  useEffect(() => {
    onSetReportLocationRef.current = onSetReportLocation;
  }, [onSetReportLocation]);

  useEffect(() => {
    onSelectReportRef.current = onSelectReport;
  }, [onSelectReport]);

  // Initialize leaflet map reference once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance to guarantee clean redraws
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      minZoom: 12,
      maxZoom: 18,
    }).setView([BRANDS_LAT, BRANDS_LNG], 14);

    mapInstanceRef.current = map;

    // OpenStreetMap tile layer configuration
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | Brandsen Municipio',
    }).addTo(map);

    // Event listener for map clicks (Reporting node selection)
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      
      // Perform simple reverse-geocoding estimation based on distance to brandsen center
      let estimatedAddress = `Calle s/n, Seccional Brandsen (Coord: ${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            // Shorten the address for practical UI reporting purposes
            const parts = data.display_name.split(',');
            estimatedAddress = parts.slice(0, 3).join(',');
          }
        }
      } catch (err) {
        console.warn('Geocoding offline or blocked, using estimated fallback:', err);
      }

      onSetReportLocationRef.current({ lat, lng, address: estimatedAddress });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run scale once on mount!

  // Create or update existing markers on reported incidence changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old incident markers
    Object.keys(incidentMarkersMapRef.current).forEach((key) => {
      const marker = incidentMarkersMapRef.current[key];
      if (marker) {
        marker.remove();
      }
    });
    incidentMarkersMapRef.current = {};

    // Render each report
    reports.forEach((report) => {
      let color = '#ef4444'; // red for Reportado
      let ringColor = 'rgba(239, 68, 68, 0.4)';
      let textStatus = 'Reportado';

      if (report.status === 'En Revisión') {
        color = '#f59e0b'; // amber
        ringColor = 'rgba(245, 158, 11, 0.4)';
        textStatus = 'En Revisión';
      } else if (report.status === 'En Cuadrilla') {
        color = '#3b82f6'; // blue
        ringColor = 'rgba(59, 130, 246, 0.4)';
        textStatus = 'En Cuadrilla';
      } else if (report.status === 'Cerrado') {
        color = '#10b981'; // emerald
        ringColor = 'rgba(16, 185, 129, 0.4)';
        textStatus = 'Resuelto';
      }

      // Categorization emojis
      let emoji = '⚠️';
      if (report.category === 'Luminaria rota') emoji = '💡';
      else if (report.category === 'Bache') emoji = '🕳️';
      else if (report.category === 'Árbol caído') emoji = '🌳';
      else if (report.category === 'Cable cortado') emoji = '⚡';
      else if (report.category === 'Residuos especiales') emoji = '🗑️';

      // Custom marker representing category emoji inside colorful pulsing frame
      const pulseDivIcon = L.divIcon({
        className: 'custom-pulse-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; cursor: pointer;">
            <div style="
              position: absolute;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${ringColor};
              animation: pulse-animation 2s infinite;
            "></div>
            <div style="
              position: relative;
              z-index: 10;
              background: white;
              width: 25px;
              height: 25px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              border: 2px solid ${color};
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
            ">
              ${emoji}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([report.lat, report.lng], { icon: pulseDivIcon })
        .addTo(map)
        .on('click', () => {
          onSelectReportRef.current(report);
        });

      // Bind simple popup
      const dateFormatted = new Date(report.createdAt).toLocaleDateString();
      marker.bindPopup(`
        <div style="font-family: inherit; width: 170px;">
          <div style="font-weight: 800; font-size: 13px; color: #1e293b; margin-bottom: 2px;">
            ${emoji} ${report.category}
          </div>
          <div style="font-size: 11px; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            📍 ${report.address}
          </div>
          <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span style="
              display: inline-block;
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 1px 6px;
              border-radius: 4px;
              color: white;
              background: ${color};
            ">
              ${textStatus}
            </span>
            <span style="font-size: 10px; color: #64748b;">${dateFormatted}</span>
          </div>
        </div>
      `);

      incidentMarkersMapRef.current[report.id] = marker;
    });
  }, [reports]);

  // Update center and select popups as active report selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedReport) return;

    const { lat, lng, id } = selectedReport;
    map.setView([lat, lng], 16);

    const targetMarker = incidentMarkersMapRef.current[id];
    if (targetMarker) {
      targetMarker.openPopup();
    }
  }, [selectedReport]);

  // Handle reporting pin marker (the active user-dropped pins)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!reportLocation || !isNeighborVerified) {
      if (currentPinMarkerRef.current) {
        currentPinMarkerRef.current.remove();
        currentPinMarkerRef.current = null;
      }
      return;
    }

    const { lat, lng } = reportLocation;

    // Create unique user pin marker icon
    const neighborPinIcon = L.divIcon({
      className: 'new-pin-icon',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            background: #0284c7;
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 9999px;
            white-space: nowrap;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 1px solid white;
            margin-bottom: 2px;
          ">
            Nuevo reporte aquí!
          </div>
          <div style="
            width: 14px;
            height: 14px;
            background: #0284c7;
            border: 2.5px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          "></div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #0284c7;
            margin-top: -1px;
          "></div>
        </div>
      `,
      iconSize: [120, 40],
      iconAnchor: [60, 40],
    });

    if (currentPinMarkerRef.current) {
      currentPinMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { 
        icon: neighborPinIcon,
        draggable: true
      }).addTo(map);

      marker.on('dragend', async (event) => {
        const m = event.target;
        const position = m.getLatLng();
        const dragLat = position.lat;
        const dragLng = position.lng;
        
        let estimatedAddress = `Calle de Brandsen (Coord: ${dragLat.toFixed(4)}, ${dragLng.toFixed(4)})`;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${dragLat}&lon=${dragLng}&zoom=18&addressdetails=1`
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              const parts = data.display_name.split(',');
              estimatedAddress = parts.slice(0, 3).join(',');
            }
          }
        } catch (err) {
          console.warn('Geocoding offline, using coordinates fallback:', err);
        }
        
        onSetReportLocationRef.current({ lat: dragLat, lng: dragLng, address: estimatedAddress });
      });

      currentPinMarkerRef.current = marker;
    }

    if (isReportingMode) {
      map.panTo([lat, lng]);
    }
  }, [reportLocation, isReportingMode, isNeighborVerified]);

  return (
    <div className="relative w-full h-[380px] md:h-[500px] bg-slate-200 rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {/* Help Banner indicating mapping interactive instructions */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[500] bg-slate-900/95 text-white text-[11px] px-4 py-2.5 rounded-full flex items-center gap-2 border border-slate-800 backdrop-blur-sm shadow-lg max-w-[90%] text-center">
        <MapPin size={13} className="text-brand-400 shrink-0 animate-bounce" />
        <span className="font-semibold text-slate-200">
          {isReportingMode 
            ? (isNeighborVerified 
                ? '¡Reporte georreferenciado! Podés ARRASTRAR el pin azul si querés ajustar la ubicación.'
                : '🔒 Completá tu verificación de vecino para ver y ajustar el marcador en el mapa.')
            : 'Explorá los reportes. Hacé clic en cualquier pin para ver el detalle.'}
        </span>
      </div>

      {/* Actual Map Canvas container */}
      <div id="brandsen-leaflet-map" ref={mapContainerRef} className="w-full h-full" />

      {/* Floating coordinates indicator */}
      {reportLocation && isReportingMode && (
        <div className="absolute bottom-3 left-3 z-[500] bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-[10px] space-y-1 block max-w-xs transition-all animate-fadeIn">
          <div className="font-bold text-slate-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
            Coordenadas Marcadas:
          </div>
          <div className="font-mono text-slate-500 bg-slate-50 p-1 rounded border border-slate-100 flex gap-2">
            <span>LAT: {reportLocation.lat.toFixed(5)}</span>
            <span>LNG: {reportLocation.lng.toFixed(5)}</span>
          </div>
        </div>
      )}

      {/* Geographic reference legends */}
      <div className="absolute bottom-3 right-3 z-[500] bg-white/95 border border-slate-200/50 backdrop-blur-md p-2.5 rounded-xl shadow-lg text-[10px] space-y-1">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">Estado de Reclamos</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>Reportados</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>En Revisión</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>En Cuadrilla</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Resueltos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
