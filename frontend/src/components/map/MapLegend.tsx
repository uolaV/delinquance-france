'use client';

export default function MapLegend() {
  const steps = [
    { color: '#7f1d1d', label: '> +50%' },
    { color: '#dc2626', label: '+15 à +50%' },
    { color: '#f87171', label: '+5 à +15%' },
    { color: '#d1d5db', label: '−5 à +5%' },
    { color: '#6ee7b7', label: '−5 à −15%' },
    { color: '#059669', label: '−15 à −30%' },
    { color: '#065f46', label: '< −30%' },
    { color: '#374151', label: 'Pas de données' },
  ];

  return (
    <div className="absolute bottom-8 left-4 z-[1000] bg-[#0f1117]/90 border border-[#2a2d3a] rounded-xl px-4 py-3 backdrop-blur-sm">
      <p className="text-xs font-medium text-[#7b8099] uppercase tracking-wide mb-2">
        Évolution 5 ans
      </p>
      <div className="space-y-1">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-[#7b8099]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
