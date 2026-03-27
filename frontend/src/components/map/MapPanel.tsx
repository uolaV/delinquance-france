'use client';

import { PanelData, INDICATEURS, evolutionLabel } from '../../lib/map';
import Link from 'next/link';

interface Props {
  data: PanelData | null;
  loading: boolean;
  onClose: () => void;
}

const INDICATEUR_ICONS: Record<string, string> = {
  coups_blessures_volontaires: '👊',
  vols_avec_violence: '🔪',
  vols_sans_violence: '💼',
  cambriolages_logement: '🏠',
  vols_vehicules: '🚗',
  destructions_degradations: '🔥',
  stupefiants_usage: '💊',
  violences_sexuelles: '⚠️',
  escroqueries: '💳',
};

export default function MapPanel({ data, loading, onClose }: Props) {
  if (!data && !loading) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0,
      height: '100%',
      width: 320,
      background: 'rgba(8,11,18,0.95)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderLeft: '1px solid var(--border)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <p className="section-label" style={{ margin: 0 }}>Commune</p>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28,
            borderRadius: 8,
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, lineHeight: 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
          }}
        >
          ×
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 32, height: 32,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : data ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Commune header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 4 }}>
              {data.commune.nom}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Département {data.commune.departement}
              {' · '}
              {(data.commune.population / 1000).toFixed(0)}k habitants
              {data.commune.indice_pauvrete ? ` · Pauvreté ${data.commune.indice_pauvrete}%` : ''}
            </p>
          </div>

          {/* Parti / Maire */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {data.commune.parti_couleur && (
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${data.commune.parti_couleur}22`,
                  border: `1px solid ${data.commune.parti_couleur}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 10, height: 10,
                    borderRadius: '50%',
                    background: data.commune.parti_couleur,
                    boxShadow: `0 0 8px ${data.commune.parti_couleur}80`,
                  }} />
                </div>
              )}
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {data.commune.parti_nom || 'Parti inconnu'}
                  {data.commune.parti_sigle && data.commune.parti_sigle !== data.commune.parti_nom
                    ? <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>({data.commune.parti_sigle})</span>
                    : ''}
                </p>
                {data.commune.maire_nom && data.commune.maire_nom !== 'Inconnu' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{data.commune.maire_nom}</p>
                )}
                {data.commune.mandat_debut && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Depuis {new Date(data.commune.mandat_debut).getFullYear()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Données dispo */}
          {data.annees?.annee_min && (
            <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                Données SSMSI : {data.annees.annee_min} → {data.annees.annee_max}
              </p>
            </div>
          )}

          {/* Évolutions */}
          <div style={{ padding: '16px 20px' }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Évolution sur 5 ans</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.evolutions.map((ev) => {
                const pct = ev.evolution_pct !== null ? parseFloat(String(ev.evolution_pct)) : null;
                const isUp = pct !== null && pct > 0;
                const isDown = pct !== null && pct < 0;
                const icon = INDICATEUR_ICONS[ev.indicateur] || '•';
                const barWidth = pct !== null ? Math.min(Math.abs(pct) / 60 * 100, 100) : 0;

                return (
                  <div key={ev.indicateur} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-elevated)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 11 }}>{icon}</span>
                        {INDICATEURS[ev.indicateur] || ev.indicateur}
                      </span>
                      <span style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: pct === null ? 'var(--text-muted)' : isUp ? 'var(--red)' : isDown ? 'var(--green)' : 'var(--text-secondary)',
                        letterSpacing: '-0.02em',
                      }}>
                        {evolutionLabel(pct)}
                      </span>
                    </div>
                    {pct !== null && (
                      <div style={{ height: 3, borderRadius: 2, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          borderRadius: 2,
                          background: isUp ? 'var(--red)' : 'var(--green)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: '0 20px 20px' }}>
            <Link
              href={`/ville/${data.commune.code_insee}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, width: '100%',
                padding: '11px 20px',
                borderRadius: 10,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s',
                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(59,130,246,0.4)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)';
              }}
            >
              Fiche complète →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
