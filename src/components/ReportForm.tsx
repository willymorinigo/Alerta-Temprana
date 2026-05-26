import React, { useState, useEffect } from 'react';
import { IncidentCategory, IncidentReport } from '../types';
import { MapPin, Image as ImageIcon, CheckCircle2, User, Phone, HelpCircle, Loader2, ShieldCheck, Mail, LogOut, Check, ArrowLeft } from 'lucide-react';

interface ReportFormProps {
  reportLocation: { lat: number; lng: number; address: string } | null;
  onSubmitReport: (data: {
    category: IncidentCategory;
    description: string;
    lat: number;
    lng: number;
    address: string;
    neighborName?: string;
    neighborPhone?: string;
    photoUrl?: string;
    locality?: string;
  }) => Promise<void>;
  onCancel: () => void;
  onSetReportLocation: (loc: { lat: number; lng: number; address: string }) => void;
  neighborSession: { name: string; dni: string; phone: string; locality: string; verified: boolean } | null;
  onVerifyNeighbor: (session: { name: string; dni: string; phone: string; locality: string; verified: boolean }) => void;
  onLogoutNeighbor: () => void;
}

// Preset visual mock templates corresponding to categories for demo aesthetics
const PHOTO_TEMPLATES_BY_CATEGORY: { [key in IncidentCategory]: string[] } = {
  'Luminaria rota': [
    'https://images.unsplash.com/photo-1518364538800-6bcb3f25da49?w=600&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1543232263-2f0851ecfc58?w=600&auto=format&fit=crop&q=60'
  ],
  'Bache': [
    'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1599740831144-5e144effb6f4?w=600&auto=format&fit=crop&q=60'
  ],
  'Árbol caído': [
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=60'
  ],
  'Cable cortado': [
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=60'
  ],
  'Residuos especiales': [
    'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=60'
  ],
  'Otro': [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1525498122383-1762a0501009?w=600&auto=format&fit=crop&q=60'
  ]
};

// Coordinates center matching for localized towns in Coronel Brandsen partido
const LOCALITY_COORDS: { [key: string]: { lat: number; lng: number } } = {
  'Brandsen': { lat: -35.1685, lng: -58.2323 },
  'Gómez': { lat: -35.0664, lng: -58.3846 },
  'Jeppener': { lat: -35.2758, lng: -58.1965 },
  'Altamirano': { lat: -35.3411, lng: -58.1472 },
  'Samborombón': { lat: -35.1950, lng: -58.1054 },
  'Oliden': { lat: -35.1542, lng: -57.9408 },
  'Las Acacias': { lat: -35.1995, lng: -58.2580 }
};

export default function ReportForm({
  reportLocation,
  onSubmitReport,
  onCancel,
  onSetReportLocation,
  neighborSession,
  onVerifyNeighbor,
  onLogoutNeighbor
}: ReportFormProps) {
  const [category, setCategory] = useState<IncidentCategory>('Luminaria rota');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMess, setErrorMess] = useState('');

  // Local verification inputs
  const [vName, setVName] = useState('');
  const [vDni, setVDni] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vLocality, setVLocality] = useState('Brandsen');
  const [vCode, setVCode] = useState('');
  const [vSendingCode, setVSendingCode] = useState(false);
  const [vCodeSent, setVCodeSent] = useState(false);
  const [vError, setVError] = useState('');

  // Synchronize pin updates
  useEffect(() => {
    if (reportLocation) {
      setAddress(reportLocation.address);
      
      // Auto-set first mock image template based on selected category when location is dropped
      const templates = PHOTO_TEMPLATES_BY_CATEGORY[category];
      if (templates && templates.length > 0 && !photoUrl) {
        setPhotoUrl(templates[0]);
      }
    }
  }, [reportLocation]);

  // Adjust photo template choice as user changes index categories
  const handleCategoryChange = (val: IncidentCategory) => {
    setCategory(val);
    const templates = PHOTO_TEMPLATES_BY_CATEGORY[val];
    if (templates && templates.length > 0) {
      setPhotoUrl(templates[0]); // update photo template automatically for sleek demo flow
    }
  };

  const startVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setVError('');

    if (!vName.trim()) {
      setVError('Ingresá tu nombre y apellido.');
      return;
    }
    if (vDni.trim().length < 7) {
      setVError('Ingresá un DNI válido para verificar contra el padrón del Partido.');
      return;
    }
    if (vPhone.trim().length < 8) {
      setVError('Ingresá tu número de teléfono celular con código de área.');
      return;
    }

    setVSendingCode(true);

    // Reposition map to chosen town to let them see where reports go
    const coords = LOCALITY_COORDS[vLocality] || LOCALITY_COORDS['Brandsen'];
    onSetReportLocation({
      lat: coords.lat,
      lng: coords.lng,
      address: `Cerca de Estación o Plaza Principal, ${vLocality}`
    });

    // Simulate sending SMS network handshake after 1.5 seconds
    setTimeout(() => {
      setVSendingCode(false);
      setVCodeSent(true);
    }, 1500);
  };

  const confirmVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    setVError('');

    if (vCode === '2026' || vCode.trim() === '2026') {
      onVerifyNeighbor({
        name: vName,
        phone: vPhone,
        dni: vDni,
        locality: vLocality,
        verified: true
      });

      // After verification, automatically position/center the map on the citizen's town!
      const coords = LOCALITY_COORDS[vLocality] || LOCALITY_COORDS['Brandsen'];
      onSetReportLocation({
        lat: coords.lat,
        lng: coords.lng,
        address: `Calle céntrica de ${vLocality}, Partido de Coronel Brandsen`
      });
    } else {
      setVError('Código SMS incorrecto. Utilizá el código "2026" provisto por el sistema.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess('');

    if (!neighborSession || !neighborSession.verified) {
      setErrorMess('Debes verificar tu identidad ciudadana antes de proceder.');
      return;
    }

    if (!reportLocation) {
      setErrorMess('Por favor, selecciona una ubicación exacta haciendo un toque en el mapa.');
      return;
    }

    if (description.trim().length < 10) {
      setErrorMess('La descripción debe detallar claramente el siniestro (mínimo 10 caracteres).');
      return;
    }

    if (!address.trim()) {
      setErrorMess('La descripción o altura aproximada es obligatoria.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitReport({
        category,
        description,
        lat: reportLocation.lat,
        lng: reportLocation.lng,
        address,
        neighborName: neighborSession.name,
        neighborPhone: neighborSession.phone,
        locality: neighborSession.locality,
        photoUrl: photoUrl || PHOTO_TEMPLATES_BY_CATEGORY[category][0],
      });
      
      // Clear incident inputs
      setDescription('');
    } catch (err: any) {
      setErrorMess(err.message || 'Fallo de red al intentar guardar la incidencia.');
    } finally {
      setSubmitting(false);
    }
  };

  // RENDER STEP 1: If neighbor is not verified, show Citizen Verification Wizard
  if (!neighborSession || !neighborSession.verified) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4 max-w-lg mx-auto text-left relative overflow-hidden">
        
        {/* Prominent header home-return button */}
        <button
          type="button"
          onClick={onCancel}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-200 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>← Volver al Listado / Ver Mapa General</span>
        </button>

        <div className="border-b border-slate-100 pb-3 block mt-2">
          <div className="flex items-center gap-2 text-brand-700">
            <ShieldCheck size={20} className="shrink-0 animate-pulse" />
            <h3 className="text-sm md:text-base font-extrabold font-display text-slate-800">Verificación Obligatoria de Vecino</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Para evitar falsos reportes y preservar el orden en las cuadrillas de <strong>Coronel Brandsen</strong>, debés autenticarte con tu DNI y celular.
          </p>
        </div>

        {vError && (
          <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-100 font-semibold">
            ⚠️ {vError}
          </div>
        )}

        {!vCodeSent ? (
          <form onSubmit={startVerification} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Nombre Completo</label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Carlos Di Filippo"
                value={vName}
                onChange={(e) => setVName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">DNI</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 34.123.456"
                  value={vDni}
                  onChange={(e) => setVDni(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Celular (SMS)</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 2223 45-2342"
                  value={vPhone}
                  onChange={(e) => setVPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Localidad de Residencia</label>
              <select
                value={vLocality}
                onChange={(e) => {
                  const loc = e.target.value;
                  setVLocality(loc);
                  // Instantly position blue pin on the map so they see it!
                  const coords = LOCALITY_COORDS[loc] || LOCALITY_COORDS['Brandsen'];
                  onSetReportLocation({
                    lat: coords.lat,
                    lng: coords.lng,
                    address: `Plaza o calle principal, ${loc}`
                  });
                }}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-850 font-bold"
              >
                <option value="Brandsen">Brandsen (Cabecera)</option>
                <option value="Gómez">Gómez</option>
                <option value="Jeppener">Jeppener</option>
                <option value="Altamirano">Altamirano</option>
                <option value="Samborombón">Samborombón</option>
                <option value="Oliden">Oliden</option>
                <option value="Las Acacias">Las Acacias</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                El pin azul de ubicación se colocará automáticamente en el centro de <strong>{vLocality}</strong> para que lo mires en el mapa.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={vSendingCode}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              >
                {vSendingCode ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Enviando PIN...</span>
                  </>
                ) : (
                  <span>Recibir PIN SMS 📲</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={confirmVerificationCode} className="space-y-4">
            <div className="p-3 bg-brand-50 rounded-2xl border border-brand-100 text-brand-850 text-[11px] space-y-1.5 leading-snug">
              <p className="font-extrabold flex items-center gap-1 text-brand-800">
                <Check size={14} />
                <span>Simulación de Alertas de Gobierno Brandsen</span>
              </p>
              <p>Se envió un SMS de autenticación al <strong>{vPhone}</strong>.</p>
              <p className="font-bold text-brand-700 mt-1 bg-white px-2 py-1.5 rounded-lg border border-brand-100 inline-block">
                🔑 Tu Código PIN de Acceso es: <span className="font-mono text-xs font-black text-slate-900 tracking-wider">2026</span>
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Ingresá el PIN de 4 dígitos</label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="Ingresá 2026"
                value={vCode}
                onChange={(e) => setVCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-center font-black text-lg tracking-widest text-slate-800 focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setVCodeSent(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl active:scale-95"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow hover:shadow-md transition-all cursor-pointer active:scale-95"
              >
                Ingresar al Formulario 🌿
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // RENDER STEP 2: Citizen is verified, show ReportForm containing pre-filled locked credentials!
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4 max-w-lg mx-auto text-left relative">
      
      {/* Prominent header home-return button */}
      <button
        type="button"
        onClick={onCancel}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-200 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <ArrowLeft size={14} />
        <span>← Volver al Listado / Ver Mapa General</span>
      </button>

      {/* Title */}
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between mt-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-base font-extrabold font-display text-slate-800">Registrar Reporte Vecinal</h3>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full py-0.5 px-2 text-[8px] uppercase tracking-wider font-extrabold flex items-center gap-0.5 shadow-2xs">
              <ShieldCheck size={10} /> Vecino Autenticado
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-tight">Ubicación asistida e imágenes de alta definición</p>
        </div>
        <span className="text-xl shrink-0">✍️</span>
      </div>

      {errorMess && (
        <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-100 font-semibold leading-relaxed">
          ⚠️ {errorMess}
        </div>
      )}

      {/* 0. Neighbors verified details badge */}
      <div className="bg-brand-50/60 border border-brand-100 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5 text-left">
          <div className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Vecino Informante</div>
          <div className="text-brand-950 font-black text-xs">{neighborSession.name}</div>
          <div className="text-[10px] text-slate-600 font-medium font-display flex flex-wrap items-center gap-x-2">
            <span>DNI: {neighborSession.dni}</span> • 
            <span className="bg-brand-100/70 text-brand-900 font-bold px-1 py-0.2 rounded">Zona: {neighborSession.locality}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogoutNeighbor}
          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-700 hover:text-red-800 transition-colors cursor-pointer active:scale-95"
          title="Cerrar sesión de vecino"
        >
          <LogOut size={12} />
        </button>
      </div>

      {/* Localidad del Siniestro selector (Automatically positions the blue pin on change) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Localidad del Partido</label>
        <select
          value={neighborSession.locality}
          onChange={(e) => {
            const loc = e.target.value;
            // Update parent and local state
            onVerifyNeighbor({
              ...neighborSession,
              locality: loc
            });
            // Instantly center map and place/refresh the pin there!
            const coords = LOCALITY_COORDS[loc] || LOCALITY_COORDS['Brandsen'];
            onSetReportLocation({
              lat: coords.lat,
              lng: coords.lng,
              address: `Centro de ${loc}, Coronel Brandsen`
            });
          }}
          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-850 font-extrabold focus:outline-none"
        >
          <option value="Brandsen">Brandsen (Cabecera)</option>
          <option value="Gómez">Gómez</option>
          <option value="Jeppener">Jeppener</option>
          <option value="Altamirano">Altamirano</option>
          <option value="Samborombón">Samborombón</option>
          <option value="Oliden">Oliden</option>
          <option value="Las Acacias">Las Acacias</option>
        </select>
        <p className="text-[10px] text-slate-400">
          📍 Al cambiar la localidad, el pin en el mapa saltará automáticamente a <strong>{neighborSession.locality}</strong>.
        </p>
      </div>

      {/* 1. Category selector */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Tipo de Incidencia</label>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value as IncidentCategory)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-800"
        >
          <option value="Luminaria rota">💡 Luminaria rota / Columnas apagadas</option>
          <option value="Bache">🕳️ Bache o daño crítico de calzada</option>
          <option value="Árbol caído">🌳 Rama pesada o Árbol caído</option>
          <option value="Cable cortado">⚡ Cable colgando o cortado</option>
          <option value="Residuos especiales">🗑️ Basura / Residuos de podas u obras</option>
          <option value="Otro">⚠️ Otro reclamo de servicios</option>
        </select>
      </div>

      {/* 2. Map coordinates state alert */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Ubicación y Dirección Deducida</span>
          <span className="text-[10px] text-brand-650 font-bold lowercase italic">(Podes arrastrar el pin azul en el mapa)</span>
        </label>
        
        {reportLocation ? (
          <div className="p-3 bg-brand-50/70 text-brand-950 border border-brand-100 rounded-xl flex items-start gap-2.5 transition-all">
            <MapPin size={16} className="text-brand-600 mt-1 shrink-0 animate-bounce" />
            <div className="text-xs flex-1">
              <span className="font-bold text-slate-700">Verifica la altura / calle:</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 mt-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none h-14"
                title="Corregir dirección deducida"
                placeholder="Por ejemplo: San Martín 123, Jeppener (o cruce de vías)"
              />
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-red-50/50 border border-dashed border-red-200 rounded-xl text-center text-xs text-red-800 font-medium flex flex-col items-center gap-1">
            <span className="text-base animate-pulse">🗺️</span>
            <span>Error de mapa. Hace un clic en tu localidad para reinstanciar el marcador.</span>
          </div>
        )}
      </div>

      {/* 3. Description text area */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex justify-between items-center font-display">
          <span>Detalles específicos</span>
          <span className={`${description.length >= 10 ? 'text-brand-600 font-bold' : 'text-slate-400'} text-[10px] font-normal`}>
            {description.length} caracteres (mínimo 10)
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Escribí referencias (ej: es en la esquina de la farmacia, frente al club, pilar verde...)"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white min-h-[70px]"
          maxLength={300}
          required
        ></textarea>
      </div>

      {/* 4. Mock Illustrative Photo selector */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
          <ImageIcon size={14} className="text-slate-400" />
          <span>Foto Adjunta (Simulado / Referencia)</span>
        </label>

        {/* Templates suggestions list */}
        <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
          <p className="text-[10px] text-slate-500 font-normal leading-tight">
            Elegí una imagen de alta definición de nuestra base de muestras o dejá la que viene por defecto:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PHOTO_TEMPLATES_BY_CATEGORY[category]?.map((url, idx) => (
              <button
                key={url}
                type="button"
                onClick={() => setPhotoUrl(url)}
                className={`relative rounded-lg overflow-hidden h-14 border-2 transition-all ${
                  photoUrl === url ? 'border-brand-600 shadow scale-95' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <img src={url} alt={`opcion-${idx}`} className="w-full h-full object-cover" />
                {photoUrl === url && (
                  <div className="absolute inset-0 bg-brand-950/40 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-white" />
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">
                  Opción {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Actions */}
      <div className="flex gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md  flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
        >
          {submitting ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Cargando...</span>
            </>
          ) : (
            <span>Enviar Reclamo 🚀</span>
          )}
        </button>
      </div>
    </form>
  );
}
