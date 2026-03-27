'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CommuneMapFeature, PanelData, evolutionToColor, INDICATEURS } from '../../lib/map';
import MapPanel from './MapPanel';
import SearchBar from './SearchBar';
import MapLegend from './MapLegend';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const GEO_API = 'https://geo.api.gouv.fr';
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

  useEffect(() => {
    fetch(`${API_URL}/api/map/communes?indicateur=${selectedIndicateur}`)
      .then(r => r.json())
      .then(d => setCommunes(d.data || []))
      .catch(() => {});
  }, [selectedIndicateur]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current) return;
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      const map = L.map('leaflet-map', {
        center: [46.5, 2.5], zoom: 6, minZoom: 5, maxZoom: 13,
        zoomControl: false,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = { map, L };
      setMapReady(true);
    });
    return () => { if (mapRef.current) { mapRef.current.map.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || communes.length === 0) return;
    const { map, L } = mapRef.current;
    layerGroupRef.current.clearLayers();
    circleLayersRef.current.clear();

    communes.forEach(commune => {
      if (!commune.latitude || !commune.longitude) return;
      const pct = commune.evolution_pct !== null ? parseFloat(String(commune.evolution_pct)) : null;
      const color = colorMode === 'evolution'
        ? evolutionToColor(pct)
        : (commune.parti_couleur || '#1E293B');

      const radius = Math.max(2500, Math.min(18000, Math.sqrt(commune.population) * 75));
      const isSelected = commune.code_insee === selectedCode;

      const circle = L.circle([commune.latitude, commune.longitude], {
        radius,
        fillColor: color,
        fillOpacity: isSelected ? 0.95 : 0.7,
        color: isSelected ? '#fff' : 'rgba(0,0,0,0)',
        weight: isSelected ? 2 : 0,
      });

      circle.on('click', () => handleCommuneClick(commune.code_insee));
      circle.on('mouseover', function(this: any) {
        this.setStyle({ fillOpacity: 0.9, weight: 1, color: 'rgba(255,255,255,0.4)' });
        const evoStr = pct !== null ? ` · ${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` : '';
        this.bindTooltip(
          `<strong style="letter-spacing:-0.01em">${commune.nom}</strong>` +
          (commune.parti_sigle ? `<br><span style="opacity:0.6;font-size:11px">${commune.parti_sigle}${evoStr}</span>` : ''),
          { permanent: false, direction: 'top', className: 'leaflet-tooltip-dark' }
        ).openTooltip();
      });
      circle.on('mouseout', function(this: any) {
        const sel = commune.code_insee === selectedCode;
        this.setStyle({ fillOpacity: sel ? 0.95 : 0.7, weight: sel ? 2 : 0, color: sel ? '#fff' : 'rgba(0,0,0,0)' });
      });

      layerGroupRef.current.addLayer(circle);
      circleLayersRef.current.set(commune.code_insee, circle);
    });
  }, [mapReady, communes, colorMode, selectedIndicateur, selectedCode]);

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

  const handleSearchSelect = useCallback(async (codeInsee: string, nom: string) => {
    if (!mapRef.current) return;
    const { map } = mapRef.current;
    try {
      const res = await fetch(`${GEO_API}/communes/${codeInsee}?fields=centre&format=geojson`);
      const data = await res.json();
      const [lng, lat] = data.geometry?.coordinates || [];
      if (lat && lng) map.setView([lat, lng], 12, { animate: true });
    } catch {}
    await handleCommuneClick(codeInsee);
  }, [handleCommuneClick]);

  const panelOpen = panelData !== null || panelLoading;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Top controls */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <SearchBar onSelect={handleSearchSelect} />

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(8,11,18,0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-hover)',
          borderRadius: 12,
          padding: 4,
          gap: 2,
        }}>
          {(['evolution', 'parti'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                background: colorMode === mode ? 'var(--accent)' : 'transparent',
                color: colorMode === mode ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {mode === 'evolution' ? '📈 Évolution' : '🏛 Parti'}
            </button>
          ))}
        </div>

        {/* Indicateur selector */}
        {colorMode === 'evolution' && (
          <select
            value={selectedIndicateur}
            onChange={e => setSelectedIndicateur(e.target.value)}
            style={{
              background: 'rgba(8,11,18,0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-hover)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {Object.entries(INDICATEURS).map(([key, label]) => (
              <option key={key} value={key} style={{ background: '#0D1117' }}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Compteur communes */}
      <div style={{
        position: 'absolute', top: 16, right: panelOpen ? 336 : 16,
        zIndex: 999,
        background: 'rgba(8,11,18,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '6px 12px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        transition: 'right 0.3s ease',
      }}>
        {communes.length.toLocaleString('fr-FR')} communes
      </div>

      {/* Carte */}
      <div
        id="leaflet-map"
        style={{ width: '100%', height: '100%', background: 'var(--bg-base)' }}
      />

      {/* Légende */}
      {colorMode === 'evolution' && <MapLegend />}

      {/* Panel */}
      <MapPanel
        data={panelData}
        loading={panelLoading}
        onClose={() => { setPanelData(null); setSelectedCode(null); setPanelLoading(false); }}
      />
    </div>
  );
}
