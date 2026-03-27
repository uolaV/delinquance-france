import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte interactive',
  description: 'Carte interactive de la délinquance par commune en France. Évolution sur 5 ans, parti politique, 9 indicateurs SSMSI.',
};

const CarteLeaflet = dynamic(
  () => import('../../components/map/CarteLeaflet'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        background: 'var(--bg-base)',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Chargement de la carte…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
);

export default function CartePage() {
  return (
    <div style={{ height: 'calc(100vh - 65px)', position: 'relative', overflow: 'hidden' }}>
      <CarteLeaflet />
    </div>
  );
}
