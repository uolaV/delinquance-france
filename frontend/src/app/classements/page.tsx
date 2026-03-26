import Link from 'next/link';
import { fetchClassement, fetchClassementFamilles, INDICATEURS } from '../../lib/api';

export const metadata = {
  title: 'Classements — Délinquance France',
};

export default async function ClassementsPage({
  searchParams,
}: {
  searchParams: { indicateur?: string };
}) {
  const indicateur = searchParams.indicateur || 'coups_blessures_volontaires';

  const [hausseData, baisseData, famillesData] = await Promise.allSettled([
    fetchClassement('hausse', indicateur),
    fetchClassement('baisse', indicateur),
    fetchClassementFamilles(indicateur),
  ]);

  const hausse = hausseData.status === 'fulfilled' ? hausseData.value.data : [];
  const baisse = baisseData.status === 'fulfilled' ? baisseData.value.data : [];
  const familles = famillesData.status === 'fulfilled' ? famillesData.value.data : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Classements</h1>
      <p className="text-[var(--text-muted)] mb-8">
        Communes de plus de 10 000 habitants, classées par évolution sur 5 ans.
      </p>

      {/* Sélecteur indicateur */}
      <div className="flex flex-wrap gap-2 mb-10">
        {Object.entries(INDICATEURS).map(([key, label]) => (
          <Link
            key={key}
            href={`/classements?indicateur=${key}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              indicateur === key
                ? 'bg-blue-600 text-white'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Par famille politique */}
      {familles.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Par famille politique — évolution moyenne</h2>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-medium">Famille</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Nb communes</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Évolution moy.</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Valeur actuelle</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Nationale</th>
                </tr>
              </thead>
              <tbody>
                {familles.map((f: any, i: number) => {
                  const evo = parseFloat(f.evolution_moyenne_pct);
                  return (
                    <tr key={f.famille} className={i > 0 ? 'border-t border-[var(--border)]' : ''}>
                      <td className="px-5 py-3 font-medium capitalize">{f.famille.replace('_', ' ')}</td>
                      <td className="px-5 py-3 text-right text-[var(--text-muted)]">{f.nb_communes}</td>
                      <td className={`px-5 py-3 text-right font-semibold font-mono ${evo > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {evo > 0 ? '+' : ''}{evo.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono">{parseFloat(f.valeur_actuelle_moyenne).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-mono text-[var(--text-muted)]">
                        {parseFloat(f.moyenne_nationale).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-[var(--text-muted)] px-5 py-3 border-t border-[var(--border)]">
              Évolution = variation sur 5 ans dans les communes actuellement dirigées par chaque famille.
              Ces chiffres ne constituent pas un jugement de causalité.
            </p>
          </div>
        </div>
      )}

      {/* Hausse / Baisse */}
      <div className="grid md:grid-cols-2 gap-6">
        <ClassementTable title="Plus forte hausse" data={hausse} sens="hausse" />
        <ClassementTable title="Plus forte baisse" data={baisse} sens="baisse" />
      </div>
    </div>
  );
}

function ClassementTable({ title, data, sens }: { title: string; data: any[]; sens: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {data.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] p-5">Données non disponibles</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">#</th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Commune</th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Parti</th>
                <th className="text-right px-4 py-3 text-[var(--text-muted)] font-medium">Évolution</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c: any, i: number) => (
                <tr key={c.code_insee} className={i > 0 ? 'border-t border-[var(--border)]' : ''}>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/ville/${c.code_insee}`} className="font-medium hover:text-blue-400 transition-colors">
                      {c.nom}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)]">{c.departement}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.parti_couleur && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.parti_couleur }} />
                      )}
                      <span className="text-xs text-[var(--text-muted)]">{c.parti_sigle || '—'}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold font-mono ${sens === 'hausse' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {parseFloat(c.evolution_pct) > 0 ? '+' : ''}{parseFloat(c.evolution_pct).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
