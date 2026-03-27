export const INDICATEURS: Record<string, string> = {
  coups_blessures_volontaires: 'Coups et blessures',
  vols_avec_violence: 'Vols avec violence',
  vols_sans_violence: 'Vols sans violence',
  cambriolages_logement: 'Cambriolages',
  vols_vehicules: 'Vols de véhicules',
  destructions_degradations: 'Destructions',
  stupefiants_usage: 'Stupéfiants',
  violences_sexuelles: 'Violences sexuelles',
  escroqueries: 'Escroqueries',
};

export type CommuneMapFeature = {
  code_insee: string;
  nom: string;
  departement: string;
  population: number;
  latitude: number | null;
  longitude: number | null;
  parti_sigle: string | null;
  parti_nom: string | null;
  parti_famille: string | null;
  parti_couleur: string | null;
  maire_nom: string | null;
  mandat_debut: string | null;
  evolution_pct: number | null;
  valeur_actuelle: number | null;
};

export type PanelData = {
  commune: {
    code_insee: string;
    nom: string;
    departement: string;
    population: number;
    indice_pauvrete: number | null;
    maire_nom: string | null;
    parti_nom: string | null;
    parti_sigle: string | null;
    parti_famille: string | null;
    parti_couleur: string | null;
    mandat_debut: string | null;
  };
  evolutions: Array<{
    indicateur: string;
    evolution_pct: number | null;
    valeur_actuelle: number | null;
  }>;
  annees: { annee_min: number; annee_max: number };
};

/**
 * Convertit une évolution % en couleur hex pour la choroplèthe.
 * Rouge = hausse, vert = baisse, gris = pas de données.
 */
export function evolutionToColor(pct: number | null): string {
  if (pct === null || pct === undefined) return '#374151'; // gris
  if (pct > 50)  return '#7f1d1d';
  if (pct > 30)  return '#b91c1c';
  if (pct > 15)  return '#dc2626';
  if (pct > 5)   return '#f87171';
  if (pct > -5)  return '#d1d5db';
  if (pct > -15) return '#6ee7b7';
  if (pct > -30) return '#059669';
  return '#065f46';
}

export function evolutionLabel(pct: number | null): string {
  if (pct === null) return '—';
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export function formatPop(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}
