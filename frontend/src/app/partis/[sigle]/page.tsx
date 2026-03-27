import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchParti, INDICATEURS } from '../../../lib/api';

export default async function PartiPage({ params }: { params: Promise<{ sigle: string }> }) {
  let data: any;
  try {
    const { sigle } = await params;
  data = await fetchParti(sigle);
  } catch {
    notFound();
  }

  const { parti, communes, evolution } = data;
  const annees = [...new Set<number>(evolution.map((e: any) => e.annee))].sort();
  const derniereAnnee = annees[annees.length - 1];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <p className="text-sm text-[var(--text-muted)] mb-6">
        <Link href="/partis" className="hover:text-white">Partis</Link>
        {' / '}
        <span className="text-white">{parti.nom}</span>
      </p>

      <div className="flex items-center gap-4 mb-10">
        <span className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: parti.couleur_hex }} />
        <div>
          <h1 className="text-3xl font-bold">{parti.nom}</h1>
          <p className="text-[var(--text-muted)]">{communes.length} communes actuellement dirigées</p>
        </div>
      </div>

      {/* Avertissement */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-sm text-yellow-200 mb-10">
        Les données ci-dessous montrent l'évolution de la délinquance <strong>pendant</strong> les mandats de ce parti.
        Elles ne constituent pas un jugement de causalité — de nombreux facteurs structurels influencent ces chiffres.
      </div>

      {/* Evolution par indicateur vs nationale */}
      {derniereAnnee && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Communes dirigées vs moyenne nationale ({derniereAnnee})</h2>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-medium">Indicateur</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Moyenne {parti.sigle}</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Nationale</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Diff.</th>
                </tr>
              </thead>
              <tbody>
                {evolution
                  .filter((e: any) => e.annee === derniereAnnee)
                  .map((e: any, i: number) => {
                    const diff = e.moyenne_nationale ? parseFloat(e.moyenne_parti) - parseFloat(e.moyenne_nationale) : null;
                    return (
                      <tr key={e.indicateur} className={i > 0 ? 'border-t border-[var(--border)]' : ''}>
                        <td className="px-5 py-3">{INDICATEURS[e.indicateur] || e.indicateur}</td>
                        <td className="px-5 py-3 text-right font-mono">{parseFloat(e.moyenne_parti).toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono text-[var(--text-muted)]">
                          {e.moyenne_nationale ? parseFloat(e.moyenne_nationale).toFixed(2) : '—'}
                        </td>
                        <td className={`px-5 py-3 text-right font-mono font-semibold ${diff === null ? '' : diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liste des communes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Communes dirigées</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {communes.map((c: any) => (
            <Link
              key={c.code_insee}
              href={`/ville/${c.code_insee}`}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 hover:border-blue-500 transition-colors"
            >
              <p className="font-medium text-sm">{c.nom}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-[var(--text-muted)]">{c.departement}</p>
                {c.evolution_globale_pct !== null && (
                  <span className={`text-xs font-semibold ${parseFloat(c.evolution_globale_pct) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {parseFloat(c.evolution_globale_pct) > 0 ? '+' : ''}{parseFloat(c.evolution_globale_pct).toFixed(1)}%
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
