import Link from 'next/link';
import { fetchCommunes, fetchClassement, INDICATEURS } from '../lib/api';

export default async function HomePage() {
  const [communesData, hausseData, baisseData] = await Promise.allSettled([
    fetchCommunes({ limit: '9' }),
    fetchClassement('hausse', 'coups_blessures_volontaires'),
    fetchClassement('baisse', 'coups_blessures_volontaires'),
  ]);

  const communes = communesData.status === 'fulfilled' ? communesData.value.data : [];
  const hausse = hausseData.status === 'fulfilled' ? hausseData.value.data?.slice(0, 5) : [];
  const baisse = baisseData.status === 'fulfilled' ? baisseData.value.data?.slice(0, 5) : [];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 24px 80px',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.12) 0%, transparent 70%)',
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 70% 80% at 50% 0%, black 0%, transparent 100%)',
          opacity: 0.5,
        }} />

        <div className="max-w-7xl mx-auto relative" style={{ zIndex: 1 }}>
          {/* Badge */}
          <div className="flex justify-center mb-6 animate-fade-up">
            <span className="badge badge-blue">
              <span style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              Données 2016–2025 · 1 106 communes
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-display text-center mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
            La délinquance en France,{' '}
            <br />
            <span className="gradient-text">commune par commune</span>
          </h1>

          <p className="text-center animate-fade-up" style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: 580,
            margin: '0 auto 40px',
            lineHeight: 1.7,
            animationDelay: '120ms',
          }}>
            Statistiques SSMSI croisées avec les mandats municipaux.
            Données publiques, aucun commentaire éditorial.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
            <Link href="/carte" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.9375rem' }}>
              <span>🗺</span>
              Explorer la carte
            </Link>
            <Link href="/classements" className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: '0.9375rem' }}>
              Voir les classements
              <span style={{ opacity: 0.5 }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '1 106', label: 'Communes couvertes', sub: '> 10 000 habitants' },
              { value: '9', label: 'Indicateurs', sub: 'SSMSI officiels' },
              { value: '10 ans', label: 'Historique', sub: '2016 → 2025' },
              { value: '100%', label: 'Open data', sub: 'Sources linkées' },
            ].map(({ value, label, sub }) => (
              <div key={label} className="text-center">
                <div className="stat-value gradient-text">{value}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 6 }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* ── Classements rapides ────────────────────────────────────────── */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label">Classements</p>
              <h2 className="text-headline">Coups & blessures volontaires</h2>
            </div>
            <Link href="/classements" className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
              Tous les classements →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <ClassementCard title="Plus forte hausse sur 5 ans" data={hausse} sens="hausse" />
            <ClassementCard title="Plus forte baisse sur 5 ans" data={baisse} sens="baisse" />
          </div>
        </div>

        {/* ── Grandes villes ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label">Communes</p>
              <h2 className="text-headline">Grandes villes</h2>
            </div>
            <Link href="/carte" className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
              Voir sur la carte →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {communes.map((c: any) => (
              <CommuneCard key={c.code_insee} commune={c} />
            ))}
          </div>
        </div>

        {/* ── CTA Partis ─────────────────────────────────────────────────── */}
        <div className="mt-16" style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid var(--border-accent)',
          borderRadius: 20,
          padding: '48px 40px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 32,
          alignItems: 'center',
        }}>
          <div>
            <h2 className="text-headline mb-3">Analyser par parti politique</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
              Comparer l'évolution de la délinquance dans les villes
              dirigées par chaque famille politique.
              <br />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Ces données ne constituent pas un jugement de causalité.
              </span>
            </p>
          </div>
          <Link href="/partis" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>
            Voir par parti →
          </Link>
        </div>
      </div>
    </>
  );
}

function CommuneCard({ commune }: { commune: any }) {
  const evo = commune.evolution_globale_pct !== null
    ? parseFloat(commune.evolution_globale_pct) : null;
  const isUp = evo !== null && evo > 0;
  const isDown = evo !== null && evo < 0;

  return (
    <Link href={`/ville/${commune.code_insee}`} className="card-interactive animate-fade-up" style={{ padding: '18px 20px', textDecoration: 'none', display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 2 }}>
            {commune.nom}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {commune.departement_nom || `Dép. ${commune.departement}`}
          </p>
        </div>
        {commune.parti_couleur && (
          <div style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: commune.parti_couleur,
            flexShrink: 0,
            marginTop: 4,
            boxShadow: `0 0 8px ${commune.parti_couleur}60`,
          }} title={commune.parti_nom} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 100,
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
          }}>
            {commune.parti_sigle || '—'}
          </span>
          {commune.population && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {(commune.population / 1000).toFixed(0)}k hab.
            </span>
          )}
        </div>
        {evo !== null && (
          <span style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: isUp ? 'var(--red)' : isDown ? 'var(--green)' : 'var(--text-secondary)',
            letterSpacing: '-0.02em',
          }}>
            {evo > 0 ? '+' : ''}{evo.toFixed(1)}%
          </span>
        )}
      </div>
    </Link>
  );
}

function ClassementCard({ title, data, sens }: { title: string; data: any[]; sens: string }) {
  const color = sens === 'hausse' ? 'var(--red)' : 'var(--green)';

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
      </div>
      {data.length === 0 ? (
        <div style={{ padding: '20px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Données non disponibles
        </div>
      ) : (
        <div>
          {data.map((c: any, i: number) => (
            <Link
              key={c.code_insee}
              href={`/ville/${c.code_insee}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{
                width: 22, height: 22,
                borderRadius: 6,
                background: 'var(--bg-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {c.nom}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {c.departement}
                  {c.parti_sigle ? ` · ${c.parti_sigle}` : ''}
                </p>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color, flexShrink: 0, letterSpacing: '-0.02em' }}>
                {parseFloat(c.evolution_pct) > 0 ? '+' : ''}{parseFloat(c.evolution_pct).toFixed(1)}%
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
