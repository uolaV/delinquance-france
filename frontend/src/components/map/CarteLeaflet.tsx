'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CommuneMapFeature, PanelData, evolutionToColor, INDICATEURS } from '../../lib/map';
import MapPanel from './MapPanel';
import SearchBar from './SearchBar';
import MapLegend from './MapLegend';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const GEO_API = 'https://geo.api.gouv.fr';

// Mode de coloration
type ColorMode = 'evolution' | 'parti';

export default function CarteLeaflet() {
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const circleLayersRef = useRef<Map<string, any>>(new Map());

  const [communes, setCommunes] = useState<CommuneMapFeature[]>([]);
  const [selectedIndicateur, setSelectedIndicateur] = useState('coups_blessures_volontaires');
  const [colorMode, setColorMode] = useState<ColorMode>('evolution');
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Charger les données communes pour la carte
  useEffect(() => {
    fetch(`${API_URL}/api/map/communes?indicateur=${selectedIndicateur}`)
      .then(r => r.json())
      .then(d => setCommunes(d.data || []))
      .catch(() => {});
  }, [selectedIndicateur]);

  // Initialiser Leaflet (client-side uniquement)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current) return; // déjà initialisé

    import('leaflet').then(L => {
      // Fix icônes Leaflet avec Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map('leaflet-map', {
        center: [46.5, 2.5],
        zoom: 6,
        minZoom: 5,
        maxZoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = { map, L };
      setMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Dessiner les cercles sur la carte quand les communes ou le mode changent
  useEffect(() => {
    if (!mapReady || !mapRef.current || communes.length === 0) return;
    const { map, L } = mapRef.current;

    // Vider le layer group
    layerGroupRef.current.clearLayers();
    circleLayersRef.current.clear();

    communes.forEach(commune => {
      if (!commune.latitude || !commune.longitude) return;

      const color = colorMode === 'evolution'
        ? evolutionToColor(commune.evolution_pct !== null ? parseFloat(String(commune.evolution_pct)) : null)
        : (commune.parti_couleur || '#374151');

      const radius = Math.max(3000, Math.min(15000, Math.sqrt(commune.population) * 80));

      const circle = L.circle([commune.latitude, commune.longitude], {
        radius,
        fillColor: color,
        fillOpacity: 0.75,
        color: '#1a1d27',
        weight: 1,
      });

      circle.on('click', () => handleCommuneClick(commune.code_insee));
      circle.on('mouseover', function(this: any) {
        this.setStyle({ weight: 2, color: '#60a5fa' });
        this.bindTooltip(
          `<strong>${commune.nom}</strong><br>` +
          `${commune.parti_sigle || '—'}` +
          (commune.evolution_pct !== null
            ? ` · ${parseFloat(String(commune.evolution_pct)) > 0 ? '+' : ''}${parseFloat(String(commune.evolution_pct)).toFixed(1)}%`
            : ''),
          { permanent: false, direction: 'top', className: 'leaflet-tooltip-dark' }
        ).openTooltip();
      });
      circle.on('mouseout', function(this: any) {
        if (commune.code_insee !== selectedCode) {
          this.setStyle({ weight: 1, color: '#1a1d27' });
        }
      });

      layerGroupRef.current.addLayer(circle);
      circleLayersRef.current.set(commune.code_insee, circle);
    });
  }, [mapReady, communes, colorMode, selectedIndicateur]);

  const handleCommuneClick = useCallback(async (codeInsee: string) => {
    setSelectedCode(codeInsee);
    setPanelLoading(true);
    setPanelData(null);
    try {
      const res = await fetch(`${API_URL}/api/map/commune/${codeInsee}`);
      const data = await res.json();
      setPanelData(data);
    } catch {}
    setPanelLoading(false);
  }, []);

  // Zoom + sélection sur une commune depuis la recherche
  const handleSearchSelect = useCallback(async (codeInsee: string, nom: string) => {
    if (!mapRef.current) return;
    const { map } = mapRef.current;

    // Zoomer sur la commune via geo.api.gouv.fr
    try {
      const res = await fetch(`${GEO_API}/communes/${codeInsee}?fields=centre&format=geojson`);
      const data = await res.json();
      const [lng, lat] = data.geometry?.coordinates || [];
      if (lat && lng) map.setView([lat, lng], 11);
    } catch {}

    await handleCommuneClick(codeInsee);
  }, [handleCommuneClick]);

  return (
    <div className="relative w-full h-full">
      {/* Contrôles */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <SearchBar onSelect={handleSearchSelect} />

        {/* Mode de couleur */}
        <div className="flex gap-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-1">
          <button
            onClick={() => setColorMode('evolution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colorMode === 'evolution' ? 'bg-blue-600 text-white' : 'text-[#7b8099] hover:text-white'}`}
          >
            Évolution
          </button>
          <button
            onClick={() => setColorMode('parti')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colorMode === 'parti' ? 'bg-blue-600 text-white' : 'text-[#7b8099] hover:text-white'}`}
          >
            Parti
          </button>
        </div>

        {/* Sélecteur indicateur (mode évolution uniquement) */}
        {colorMode === 'evolution' && (
          <select
            value={selectedIndicateur}
            onChange={e => setSelectedIndicateur(e.target.value)}
            className="bg-[#1a1d27] border border-[#2a2d3a] text-white text-xs rounded-xl px-3 py-2 outline-none"
          >
            {Object.entries(INDICATEURS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Compteur */}
      <div className="absolute top-4 right-4 z-[999] bg-[#1a1d27]/90 border border-[#2a2d3a] rounded-xl px-3 py-1.5 text-xs text-[#7b8099]">
        {communes.length} communes
      </div>

      {/* Carte Leaflet */}
      <div
        id="leaflet-map"
        className="w-full h-full"
        style={{ background: '#0f1117' }}
      />

      {/* Légende */}
      {colorMode === 'evolution' && <MapLegend />}

      {/* Panel stats */}
      <MapPanel
        data={panelData}
        loading={panelLoading}
        onClose={() => { setPanelData(null); setSelectedCode(null); }}
      />

      {/* CSS Leaflet tooltips dark */}
      <style>{`
        .leaflet-tooltip-dark {
          background: #1a1d27;
          border: 1px solid #2a2d3a;
          color: #e8eaf0;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .leaflet-tooltip-dark::before {
          border-top-color: #2a2d3a;
        }
        .leaflet-container {
          background: #0f1117;
        }
      `}</style>
    </div>
  );
}
