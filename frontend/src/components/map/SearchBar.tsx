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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-64">
      <div className="flex items-center gap-2 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl px-3 py-2">
        <svg className="text-[#7b8099] flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher une commune..."
          className="bg-transparent text-sm text-white placeholder-[#7b8099] outline-none w-full"
        />
        {loading && (
          <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-xl z-[2000] overflow-hidden">
          {results.map((r) => (
            <button
              key={r.code_insee}
              onClick={() => {
                onSelect(r.code_insee, r.nom);
                setQuery(r.nom);
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#2a2d3a] transition-colors text-left"
            >
              {r.parti_couleur && (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.parti_couleur }} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{r.nom}</p>
                <p className="text-xs text-[#7b8099]">Dép. {r.departement} · {r.population?.toLocaleString('fr-FR')} hab.</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-1 w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-xl shadow-xl z-[2000] px-4 py-3">
          <p className="text-sm text-[#7b8099]">Aucun résultat (communes &gt; 10 000 hab.)</p>
        </div>
      )}
    </div>
  );
}
