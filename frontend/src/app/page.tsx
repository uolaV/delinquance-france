import Link from 'next/link';
import { fetchCommunes, fetchClassement, INDICATEURS } from '../lib/api';

export default async function HomePage() {
  const [communesData, hausseData, baisseData] = await Promise.allSettled([
    fetchCommunes({ limit: '6' }),
    fetchClassement('hausse', 'coups_blessures_volontaires'),
    fetchClassement('baisse', 'coups_blessures_volontaires'),
  ]);

  const communes = communesData.status === 'fulfilled' ? communesData.value.data : [];
  const hausse = hausseData.status === 'fulfilled' ? hausseData.value.data?.slice(0, 5) : [];
  const baisse = baisseData.status === 'fulfilled' ? baisseData.value.data?.slice(0, 5) : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Délinquance en France
          <br />
          <span className="text-blue-400">ville par ville</span>
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
          Données publiques SSMSI — évolution de la criminalité par commune depuis 2012,
          croisées avec les mandats municipaux. Aucun commentaire éditorial.
        </p>
      </div>

      {/* Classements rapides */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <ClassementCard title="Plus forte hausse" data={hausse} sens="hausse" />
        <ClassementCard title="Plus forte baisse" data={baisse} sens="baisse" />
      </div>

      {/* Recherche + grandes villes */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Grandes villes</h2>
        <Link href="/classements" className="text-sm text-blue-400 hover:underline">
          Voir tous les classements →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {communes.map((c: any) => (
          <CommuneCard key={c.code_insee} commune={c} />
        ))}
      </div>

      {/* CTA partis */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Analyser par parti politique</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Comparer l'évolution de la criminalité dans les villes dirigées par chaque parti.
        </p>
        <Link
          href="/partis"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Voir l'analyse par parti
        </Link>
      </div>
    </div>
  );
}

function CommuneCard({ commune }: { commune: any }) {
  const evo = commune.evolution_globale_pct;
  const evoColor = evo === null ? 'text-gray-500'
    : evo > 10 ? 'text-red-400'
    : evo > 0 ? 'text-orange-400'
    : evo < -10 ? 'text-emerald-400'
    : 'text-emerald-300';

  return (
    <Link
      href={`/ville/${commune.code_insee}`}
      className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-blue-500 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white">{commune.nom}</p>
          <p className="text-xs text-[var(--text-muted)]">{commune.departement_nom}</p>
        </div>
        {commune.parti_couleur && (
          <span
            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: commune.parti_couleur }}
            title={commune.parti_nom}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-muted)]">
          {commune.parti_sigle || '—'}
          {commune.maire_nom ? ` · ${commune.maire_nom}` : ''}
        </span>
        {evo !== null && (
          <span className={`font-semibold ${evoColor}`}>
            {evo > 0 ? '+' : ''}{evo}%
          </span>
        )}
      </div>
    </Link>
  );
}

function ClassementCard({ title, data, sens }: { title: string; data: any[]; sens: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
      <h3 className="font-semibold mb-4 text-sm text-[var(--text-muted)] uppercase tracking-wide">
        {title} — CBV
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Données non disponibles</p>
      ) : (
        <div className="space-y-3">
          {data.map((c: any, i: number) => (
            <Link
              key={c.code_insee}
              href={`/ville/${c.code_insee}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <span className="text-[var(--text-muted)] text-sm w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.nom}</p>
                <p className="text-xs text-[var(--text-muted)]">{c.parti_sigle || '—'}</p>
              </div>
              <span className={`text-sm font-semibold flex-shrink-0 ${sens === 'hausse' ? 'text-red-400' : 'text-emerald-400'}`}>
                {c.evolution_pct > 0 ? '+' : ''}{c.evolution_pct}%
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
