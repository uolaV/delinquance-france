export const metadata = { title: 'Sources — Délinquance France' };

export default function SourcesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">Sources et méthodologie</h1>

      <Section title="Données de délinquance">
        <p>Les statistiques de délinquance proviennent du <strong>Service Statistique Ministériel de la Sécurité Intérieure (SSMSI)</strong>, disponibles sur data.gouv.fr.</p>
        <p className="mt-2">Les données sont exprimées <strong>pour 1 000 habitants</strong> afin de permettre la comparaison entre communes de tailles différentes.</p>
        <a href="https://www.data.gouv.fr/fr/datasets/bases-statistiques-communales-departementales-et-regionales-de-la-delinquance/" className="text-blue-400 hover:underline text-sm block mt-2" target="_blank" rel="noopener">
          Accéder aux données SSMSI →
        </a>
      </Section>

      <Section title="Données électorales">
        <p>Les résultats des élections municipales (2014, 2020) proviennent du <strong>Ministère de l'Intérieur</strong> via data.gouv.fr.</p>
        <p className="mt-2">Les nuances politiques officielles (DVG, DVD, RN, etc.) sont utilisées telles que définies par le Ministère.</p>
        <a href="https://www.data.gouv.fr/fr/datasets/elections-municipales-2020-resultats-definitifs-du-1er-tour/" className="text-blue-400 hover:underline text-sm block mt-2" target="_blank" rel="noopener">
          Résultats 2020 →
        </a>
      </Section>

      <Section title="Population et contexte">
        <p>Les données de population proviennent de l'<strong>INSEE</strong>. L'indice de pauvreté est issu du fichier Filosofi (INSEE).</p>
      </Section>

      <Section title="Charte éditoriale">
        <ul className="space-y-2 list-disc list-inside">
          <li>Les données sont affichées telles quelles, sans sélection ni filtrage orienté.</li>
          <li>Aucun jugement de causalité n'est établi entre un parti politique et l'évolution de la délinquance.</li>
          <li>Chaque chiffre est systématiquement accompagné de la <strong>moyenne nationale</strong> pour le contexte.</li>
          <li>L'indice de pauvreté est affiché pour contextualiser les différences structurelles entre communes.</li>
          <li>Tous les partis sont traités de manière identique dans l'interface.</li>
          <li>Les sources sont linkées directement sur chaque page.</li>
        </ul>
      </Section>

      <Section title="Périmètre">
        <p>Sont incluses les <strong>communes de plus de 10 000 habitants</strong>, soit environ 900 communes françaises.</p>
        <p className="mt-2">Les données couvrent la période <strong>2012–2024</strong> selon la disponibilité des fichiers SSMSI.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 text-sm text-[var(--text-muted)] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
