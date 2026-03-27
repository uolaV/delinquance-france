import Link from 'next/link';
import { fetchPartis } from '../../lib/api';

export const metadata = {
  title: 'Délinquance par parti politique — Comparaison des familles politiques',
  description: 'Évolution de la délinquance dans les villes dirigées par chaque parti politique. Comparaison PS, LR, RN, Renaissance, EELV. Données SSMSI officielles. Aucun jugement de causalité.',
  keywords: ['délinquance parti politique', 'criminalité maire', 'sécurité gauche droite', 'statistiques délinquance partis'],
  openGraph: {
    title: 'Délinquance par parti politique en France',
    description: 'Taux et évolution de la criminalité selon le parti du maire. Données publiques SSMSI.',
  },
};

export default async function PartisPage() {
  let partis: any[] = [];
  try {
    const data = await fetchPartis();
    partis = data.data;
  } catch {}

  const familles = [...new Set<string>(partis.map((p: any) => p.famille))];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Par parti politique</h1>
      <p className="text-[var(--text-muted)] mb-8">
        Évolution de la délinquance dans les communes dirigées par chaque parti.
        Ces données ne constituent pas un jugement de causalité.
      </p>

      {familles.map(famille => {
        const partisGroupe = partis.filter((p: any) => p.famille === famille && p.nb_communes_actuelles > 0);
        if (!partisGroupe.length) return null;
        return (
          <div key={famille} className="mb-10">
            <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-4 capitalize">
              {famille.replace('_', ' ')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {partisGroupe.map((p: any) => (
                <Link
                  key={p.sigle}
                  href={`/partis/${p.sigle.toLowerCase()}`}
                  className="flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-blue-500 transition-colors"
                >
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: p.couleur_hex }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.nom}</p>
                    <p className="text-xs text-[var(--text-muted)]">{p.sigle}</p>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] flex-shrink-0">
                    {p.nb_communes_actuelles} commune{p.nb_communes_actuelles > 1 ? 's' : ''}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
