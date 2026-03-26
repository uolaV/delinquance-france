const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchCommunes(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_URL}/api/communes${qs}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch communes');
  return res.json();
}

export async function fetchCommune(codeInsee: string) {
  const res = await fetch(`${API_URL}/api/communes/${codeInsee}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch commune');
  return res.json();
}

export async function fetchPartis() {
  const res = await fetch(`${API_URL}/api/partis`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error('Failed to fetch partis');
  return res.json();
}

export async function fetchParti(sigle: string) {
  const res = await fetch(`${API_URL}/api/partis/${sigle}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch parti');
  return res.json();
}

export async function fetchClassement(sens: 'hausse' | 'baisse', indicateur?: string) {
  const qs = indicateur ? `?indicateur=${indicateur}` : '';
  const res = await fetch(`${API_URL}/api/classements/${sens}${qs}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch classement');
  return res.json();
}

export async function fetchClassementFamilles(indicateur?: string) {
  const qs = indicateur ? `?indicateur=${indicateur}` : '';
  const res = await fetch(`${API_URL}/api/classements/familles${qs}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch classement familles');
  return res.json();
}

export async function fetchMoyennesNationales() {
  const res = await fetch(`${API_URL}/api/criminalite/national/moyennes`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error('Failed to fetch moyennes nationales');
  return res.json();
}

export const INDICATEURS: Record<string, string> = {
  coups_blessures_volontaires: 'Coups et blessures',
  vols_avec_violence: 'Vols avec violence',
  vols_sans_violence: 'Vols sans violence',
  cambriolages_logement: 'Cambriolages',
  vols_vehicules: 'Vols de véhicules',
  destructions_degradations: 'Destructions / dégradations',
  stupefiants_usage: 'Stupéfiants',
  violences_sexuelles: 'Violences sexuelles',
  escroqueries: 'Escroqueries',
};
