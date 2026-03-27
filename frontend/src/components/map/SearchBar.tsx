'use client';

import { useState, useEffect, useRef } from 'react';
import { CommuneMapFeature } from '../../lib/map';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Props {
  onSelect: (codeInsee: string, nom: string) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommuneMapFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); setOpen(false); return; }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/map/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.data || []);
        setOpen(true);
      } catch {}
      setLoading(false);
    }, 250);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 280 }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(8,11,18,0.9)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${focused ? 'var(--accent)' : 'var(--border-hover)'}`,
        borderRadius: 12,
        padding: '9px 14px',
        boxShadow: focused ? '0 0 0 3px var(--accent-dim)' : 'var(--shadow-sm)',
        transition: 'all 0.15s',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: focused ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0, transition: 'color 0.15s' }}>
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Rechercher une commune..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
        {loading && (
          <div style={{
            width: 14, height: 14,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            flexShrink: 0,
          }} />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: 'var(--text-muted)', cursor: 'pointer',
              lineHeight: 1, fontSize: 16, flexShrink: 0,
            }}
          >×</button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'rgba(13,17,23,0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-hover)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          zIndex: 2000,
          animation: 'fadeUp 0.15s ease',
        }}>
          {results.length > 0 ? results.map((r, i) => (
            <button
              key={r.code_insee}
              onClick={() => { onSelect(r.code_insee, r.nom); setQuery(r.nom); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px',
                background: 'transparent', border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {r.parti_couleur ? (
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${r.parti_couleur}22`,
                  border: `1px solid ${r.parti_couleur}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.parti_couleur }} />
                </div>
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {r.nom}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Dép. {r.departement} · {(r.population / 1000).toFixed(0)}k hab.
                  {r.parti_sigle ? ` · ${r.parti_sigle}` : ''}
                </p>
              </div>
            </button>
          )) : (
            <div style={{ padding: '12px 14px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Aucun résultat (communes &gt; 10 000 hab.)
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
