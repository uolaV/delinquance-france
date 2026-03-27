import type { Metadata } from 'next';
import CarteWrapper from './CarteWrapper';

export const metadata: Metadata = {
  title: 'Carte interactive',
  description: 'Carte interactive de la délinquance par commune en France. Évolution sur 5 ans, parti politique, 9 indicateurs SSMSI.',
};

export default function CartePage() {
  return (
    <div style={{ height: 'calc(100vh - 65px)', position: 'relative', overflow: 'hidden' }}>
      <CarteWrapper />
    </div>
  );
}
