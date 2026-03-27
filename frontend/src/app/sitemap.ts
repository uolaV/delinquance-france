import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://delinquance.fr';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/carte`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/classements`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/partis`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/sources`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Pages communes dynamiques
  let communePages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/api/communes?limit=1500`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    communePages = (data.data || []).map((c: { code_insee: string }) => ({
      url: `${BASE_URL}/ville/${c.code_insee}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {}

  // Pages partis
  let partiPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/api/partis`, {
      next: { revalidate: 86400 },
    });
    const data = await res.json();
    partiPages = (data.data || [])
      .filter((p: { nb_communes_actuelles: number }) => p.nb_communes_actuelles > 0)
      .map((p: { sigle: string }) => ({
        url: `${BASE_URL}/partis/${p.sigle.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }));
  } catch {}

  return [...staticPages, ...communePages, ...partiPages];
}
