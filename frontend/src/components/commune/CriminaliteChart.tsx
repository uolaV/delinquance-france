'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { INDICATEURS } from '../../lib/api';

interface Props {
  criminalite: any[];
  moyennesNationales: any[];
  annees: number[];
  indicateurs: string[];
}

const COLORS = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#e879f9', '#22d3ee', '#86efac'];

export default function CriminaliteChart({ criminalite, moyennesNationales, annees, indicateurs }: Props) {
  const [selectedIndicateur, setSelectedIndicateur] = useState(indicateurs[0] || '');

  if (!selectedIndicateur) return null;

  // Construire les données du graphique
  const chartData = annees.map(annee => {
    const communeRow = criminalite.find((c: any) => c.annee === annee && c.indicateur === selectedIndicateur);
    const natRow = moyennesNationales.find((m: any) => m.annee === annee && m.indicateur === selectedIndicateur);
    return {
      annee,
      commune: communeRow ? parseFloat(parseFloat(communeRow.valeur_pour_mille).toFixed(2)) : null,
      nationale: natRow ? parseFloat(parseFloat(natRow.moyenne_nationale).toFixed(2)) : null,
    };
  });

  return (
    <div>
      {/* Sélecteur indicateur */}
      <div className="flex flex-wrap gap-2 mb-6">
        {indicateurs.map((ind, i) => (
          <button
            key={ind}
            onClick={() => setSelectedIndicateur(ind)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedIndicateur === ind
                ? 'bg-blue-600 text-white'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white'
            }`}
          >
            {INDICATEURS[ind] || ind}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis dataKey="annee" tick={{ fill: '#7b8099', fontSize: 12 }} />
            <YAxis tick={{ fill: '#7b8099', fontSize: 12 }} width={40} />
            <Tooltip
              contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: '8px' }}
              labelStyle={{ color: '#e8eaf0' }}
            />
            <Legend wrapperStyle={{ color: '#7b8099', fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="commune"
              name="Cette commune"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: '#60a5fa', r: 3 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="nationale"
              name="Moyenne nationale"
              stroke="#7b8099"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
