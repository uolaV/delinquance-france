import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Délinquance France — Statistiques par commune',
  description: 'Statistiques de délinquance par commune et parti politique en France. Données publiques SSMSI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-bold text-white">
            Délinquance <span className="text-blue-400">France</span>
          </a>
          <div className="flex gap-6 text-sm text-[var(--text-muted)]">
            <a href="/classements" className="hover:text-white transition-colors">Classements</a>
            <a href="/partis" className="hover:text-white transition-colors">Par parti</a>
            <a href="/sources" className="hover:text-white transition-colors">Sources</a>
          </div>
        </nav>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] px-6 py-8 mt-16 text-sm text-[var(--text-muted)]">
          <div className="max-w-6xl mx-auto">
            <p className="mb-2 font-medium text-white">Charte éditoriale</p>
            <p>Ce site affiche exclusivement des données publiques (SSMSI, data.gouv.fr) sans jugement de causalité.</p>
            <p>Chaque chiffre est accompagné de la moyenne nationale. Tous les partis sont traités de manière identique.</p>
            <p className="mt-4">
              Sources : <a href="https://www.data.gouv.fr" className="underline hover:text-white">data.gouv.fr</a> — SSMSI — INSEE — Résultats élections municipales
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
