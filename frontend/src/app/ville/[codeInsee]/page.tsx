import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchCommune, INDICATEURS } from '../../../lib/api';
import CriminaliteChart from '../../../components/commune/CriminaliteChart';

export async function generateMetadata({ params }: { params: { codeInsee: string } }) {
  try {
    const data = await fetchCommune(params.codeInsee);
    return {
      title: `${data.commune.nom} — Délinquance France`,
      description: `Statistiques de délinquance à ${data.commune.nom} depuis 2012.`,
    };
  } catch {
    return { title: 'Commune — Délinquance France' };
  }
}

export default async function VillePage({ params }: { params: { codeInsee: string } }) {
  let data: any;
  try {
    data = await fetchCommune(params.codeInsee);
  } catch {
    notFound();
  }

  const { commune, mandats, criminalite, moyennes_nationales } = data;

  // Années disponibles
  const annees = [...new Set<number>(criminalite.map((c: any) => c.annee))].sort();

  // Indicateurs disponibles
  const indicateursDispos = [...new Set<string>(criminalite.map((c: any) => c.indicateur))];

  // Evolution sur tous les indicateurs
  const evolutionGlobale = computeEvolutionGlobale(criminalite);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <p className="text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-white">Accueil</Link>
        {' / '}
        {commune.departement_nom || commune.departement}
        {' / '}
        <span className="text-white">{commune.nom}</span>
      </p>

      {/* Header */}
      <div className="flex items-start gap-6 mb-10">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">{commune.nom}</h1>
          <p className="text-[var(--text-muted)]">
            {commune.departement_nom} · {commune.population?.toLocaleString('fr-FR')} habitants
            {commune.indice_pauvrete && ` · Indice de pauvreté : ${commune.indice_pauvrete}%`}
          </p>
        </div>

        {/* Mandat actif */}
        {commune.parti_nom && (
          <div
            className="bg-[var(--bg-card)] border rounded-2xl px-5 py-4 text-right flex-shrink-0"
            style={{ borderColor: commune.parti_couleur || 'var(--border)' }}
          >
            <div className="flex items-center gap-2 justify-end mb-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: commune.parti_couleur }}
              />
              <p className="font-semibold text-sm">{commune.parti_nom}</p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{commune.maire_nom}</p>
            <p className="text-xs text-[var(--text-muted)]">
              Depuis {new Date(commune.mandat_debut).getFullYear()}
            </p>
          </div>
        )}
      </div>

      {/* Evolution globale */}
      {evolutionGlobale !== null && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          <StatCard label="Évolution globale (5 ans)" value={`${evolutionGlobale > 0 ? '+' : ''}${evolutionGlobale}%`} positive={evolutionGlobale < 0} />
          <StatCard label="Commune" value={commune.nom} />
          <StatCard label="Données disponibles" value={`${annees[0]} → ${annees[annees.length - 1]}`} />
        </div>
      )}

      {/* Graphiques par indicateur */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Évolution par indicateur (pour 1 000 habitants)</h2>
        <CriminaliteChart
          criminalite={criminalite}
          moyennesNationales={moyennes_nationales}
          annees={annees}
          indicateurs={indicateursDispos}
        />
      </div>

      {/* Tableau */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Données détaillées</h2>
        <TableauCriminalite criminalite={criminalite} moyennesNationales={moyennes_nationales} />
      </div>

      {/* Historique mandats */}
      {mandats.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Historique des mandats</h2>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {mandats.map((m: any, i: number) => (
              <div key={m.id} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: m.couleur_hex || '#888' }}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{m.maire_nom}</p>
                  <p className="text-xs text-[var(--text-muted)]">{m.parti_nom || 'Sans étiquette'}</p>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(m.date_debut).getFullYear()}
                  {' → '}
                  {m.date_fin ? new Date(m.date_fin).getFullYear() : 'en cours'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      <div className="text-xs text-[var(--text-muted)]">
        <p>Sources : SSMSI (data.gouv.fr), résultats élections municipales (Ministère de l'Intérieur), INSEE.</p>
        <p>Les données sont exprimées pour 1 000 habitants. Aucun jugement de causalité n'est établi.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold ${positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function TableauCriminalite({ criminalite, moyennesNationales }: { criminalite: any[]; moyennesNationales: any[] }) {
  const derniereAnnee = Math.max(...criminalite.map((c: any) => c.annee));
  const donneesDerniereAnnee = criminalite.filter((c: any) => c.annee === derniereAnnee);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left px-5 py-3 text-[var(--text-muted)] font-medium">Indicateur</th>
            <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Commune</th>
            <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Nationale</th>
            <th className="text-right px-5 py-3 text-[var(--text-muted)] font-medium">Diff.</th>
          </tr>
        </thead>
        <tbody>
          {donneesDerniereAnnee.map((c: any, i: number) => {
            const nat = moyennesNationales.find((m: any) => m.annee === derniereAnnee && m.indicateur === c.indicateur);
            const diff = nat ? (c.valeur_pour_mille - parseFloat(nat.moyenne_nationale)) : null;
            return (
              <tr key={c.indicateur} className={i > 0 ? 'border-t border-[var(--border)]' : ''}>
                <td className="px-5 py-3">{INDICATEURS[c.indicateur] || c.indicateur}</td>
                <td className="px-5 py-3 text-right font-mono">{parseFloat(c.valeur_pour_mille).toFixed(2)}</td>
                <td className="px-5 py-3 text-right font-mono text-[var(--text-muted)]">
                  {nat ? parseFloat(nat.moyenne_nationale).toFixed(2) : '—'}
                </td>
                <td className={`px-5 py-3 text-right font-mono font-semibold ${diff === null ? '' : diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-[var(--text-muted)] px-5 py-3 border-t border-[var(--border)]">
        Données {derniereAnnee} — pour 1 000 habitants
      </p>
    </div>
  );
}

function computeEvolutionGlobale(criminalite: any[]): number | null {
  if (!criminalite.length) return null;
  const annees = [...new Set<number>(criminalite.map((c: any) => c.annee))].sort();
  if (annees.length < 2) return null;
  const derniereAnnee = annees[annees.length - 1];
  const cinqAnsAvant = derniereAnnee - 5;
  const valActuelle = criminalite.filter((c: any) => c.annee === derniereAnnee);
  const valAncienne = criminalite.filter((c: any) => c.annee >= cinqAnsAvant && c.annee < derniereAnnee);
  if (!valActuelle.length || !valAncienne.length) return null;
  const moyActuelle = valActuelle.reduce((s: number, c: any) => s + parseFloat(c.valeur_pour_mille), 0) / valActuelle.length;
  const moyAncienne = valAncienne.reduce((s: number, c: any) => s + parseFloat(c.valeur_pour_mille), 0) / valAncienne.length;
  if (moyAncienne === 0) return null;
  return Math.round(((moyActuelle - moyAncienne) / moyAncienne) * 100 * 10) / 10;
}
