'use client';

export default function MapLegend() {
  const steps = [
    { color: '#991B1B', label: '> +50%' },
    { color: '#DC2626', label: '+15 à +50%' },
    { color: '#F87171', label: '+5 à +15%' },
    { color: '#64748B', label: '-5 à +5%' },
    { color: '#34D399', label: '-5 à -15%' },
    { color: '#059669', label: '-15 à -30%' },
    { color: '#065F46', label: '< -30%' },
    { color: '#1E293B', label: 'Pas de données' },
  ];

  return (
    <div style={{
      position: 'absolute', bottom: 28, left: 16,
      zIndex: 1000,
      background: 'rgba(8,11,18,0.9)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '14px 16px',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
        Évolution 5 ans
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {steps.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
