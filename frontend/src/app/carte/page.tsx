import dynamic from 'next/dynamic';

export const metadata = {
  title: 'Carte interactive — Délinquance France',
  description: 'Carte interactive de la délinquance par commune en France depuis 2016.',
};

// Leaflet ne supporte pas le SSR — import dynamique client-only
const CarteLeaflet = dynamic(
  () => import('../../components/map/CarteLeaflet'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-[#0f1117]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#7b8099]">Chargement de la carte...</p>
      </div>
    </div>
  )}
);

export default function CartePage() {
  return (
    <div style={{ height: 'calc(100vh - 57px)', position: 'relative', overflow: 'hidden' }}>
      <CarteLeaflet />
    </div>
  );
}
