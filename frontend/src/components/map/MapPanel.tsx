'use client';

import { PanelData, INDICATEURS, evolutionLabel, formatPop } from '../../lib/map';
import Link from 'next/link';

interface Props {
  data: PanelData | null;
  loading: boolean;
  onClose: () => void;
}

export default function MapPanel({ data, loading, onClose }: Props) {
  if (!data && !loading) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-[#0f1117] border-l border-[#2a2d3a] z-[1000] flex flex-col shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2d3a]">
        <span className="text-xs font-medium text-[#7b8099] uppercase tracking-wide">Commune</span>
        <button
          onClick={onClose}
          className="text-[#7b8099] hover:text-white transition-colors text-lg leading-none"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto">
          {/* Commune name + pop */}
          <div className="px-5 py-4 border-b border-[#2a2d3a]">
            <h2 className="text-xl font-bold text-white">{data.commune.nom}</h2>
            <p className="text-sm text-[#7b8099] mt-0.5">
              Dép. {data.commune.departement} · {formatPop(data.commune.population)} hab.
              {data.commune.indice_pauvrete && ` · Pauvreté : ${data.commune.indice_pauvrete}%`}
            </p>
          </div>

          {/* Parti + Maire */}
          <div className="px-5 py-4 border-b border-[#2a2d3a]">
            <div className="flex items-center gap-3 mb-2">
              {data.commune.parti_couleur && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: data.commune.parti_couleur }}
                />
              )}
              <div>
                <p className="text-sm font-semibold text-white">
                  {data.commune.parti_nom || 'Parti inconnu'}
                  {data.commune.parti_sigle && data.commune.parti_sigle !== data.commune.parti_nom
                    ? ` (${data.commune.parti_sigle})`
                    : ''}
                </p>
                {data.commune.maire_nom && data.commune.maire_nom !== 'Inconnu' && (
                  <p className="text-xs text-[#7b8099]">{data.commune.maire_nom}</p>
                )}
                {data.commune.mandat_debut && (
                  <p className="text-xs text-[#7b8099]">
                    Depuis {new Date(data.commune.mandat_debut).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Données disponibles */}
          {data.annees?.annee_min && (
            <div className="px-5 py-2 border-b border-[#2a2d3a]">
              <p className="text-xs text-[#7b8099]">
                Données SSMSI : {data.annees.annee_min} → {data.annees.annee_max}
              </p>
            </div>
          )}

          {/* Évolutions */}
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-[#7b8099] uppercase tracking-wide mb-3">
              Évolution sur 5 ans
            </p>
            <div className="space-y-2">
              {data.evolutions.map((ev) => {
                const pct = ev.evolution_pct !== null ? parseFloat(String(ev.evolution_pct)) : null;
                const isUp = pct !== null && pct > 0;
                const isDown = pct !== null && pct < 0;
                return (
                  <div key={ev.indicateur} className="flex items-center justify-between">
                    <span className="text-xs text-[#7b8099] truncate pr-2">
                      {INDICATEURS[ev.indicateur] || ev.indicateur}
                    </span>
                    <span className={`text-xs font-semibold font-mono flex-shrink-0 ${
                      isUp ? 'text-red-400' : isDown ? 'text-emerald-400' : 'text-[#7b8099]'
                    }`}>
                      {evolutionLabel(pct)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 pb-5">
            <Link
              href={`/ville/${data.commune.code_insee}`}
              className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Voir la fiche complète →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
