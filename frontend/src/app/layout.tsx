import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: {
    default: 'Délinquance France — Statistiques par commune',
    template: '%s — Délinquance France',
  },
  description: 'Statistiques de délinquance par commune et parti politique en France. Données publiques SSMSI 2016–2025.',
  keywords: ['criminalité', 'délinquance', 'statistiques', 'communes', 'France', 'SSMSI'],
  openGraph: {
    title: 'Délinquance France',
    description: 'Statistiques de délinquance par commune et parti politique en France.',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50" style={{
      background: 'rgba(8,11,18,0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
            boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
          }}>
            📊
          </div>
          <span style={{
            fontWeight: 700,
            fontSize: '0.9375rem',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}>
            Délinquance<span style={{ color: 'var(--accent)' }}>FR</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/carte', label: 'Carte', icon: '🗺' },
            { href: '/classements', label: 'Classements', icon: '📈' },
            { href: '/partis', label: 'Par parti', icon: '🏛' },
            { href: '/sources', label: 'Sources', icon: '📋' },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href} className="nav-link">
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link href="/carte" className="btn btn-primary" style={{ fontSize: '0.8125rem', padding: '7px 16px' }}>
          Ouvrir la carte
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      marginTop: '6rem',
    }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div style={{
                width: 24, height: 24,
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12,
              }}>📊</div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                DélinquanceFR
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Données publiques SSMSI 2016–2025. Aucun jugement de causalité.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="section-label">Navigation</p>
            <div className="flex flex-col gap-2">
              {[
                ['/', 'Accueil'],
                ['/carte', 'Carte interactive'],
                ['/classements', 'Classements'],
                ['/partis', 'Par parti politique'],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="footer-link">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <p className="section-label">Sources</p>
            <div className="flex flex-col gap-2">
              {[
                ['https://www.data.gouv.fr', 'data.gouv.fr'],
                ['https://www.data.gouv.fr/fr/datasets/bases-statistiques-communales-departementales-et-regionales-de-la-delinquance/', 'SSMSI — Statistiques délinquance'],
                ['https://www.data.gouv.fr/datasets/repertoire-national-des-elus-1/', 'RNE — Élus municipaux'],
              ].map(([href, label]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="footer-link-ext">
                  {label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="divider mb-6" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ce site affiche exclusivement des données publiques sans jugement de causalité.
            Tous les partis sont traités de manière identique.
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Données SSMSI · Mise à jour 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
