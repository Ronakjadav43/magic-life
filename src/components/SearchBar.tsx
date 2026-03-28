'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, CalendarDays, FolderKanban, Users, ListTodo } from 'lucide-react';
import { globalSearch } from '@/lib/store';

interface SearchResult {
  entries: { id: string; taskName: string; date: string; category: string }[];
  projects: { id: string; name: string; clientName: string }[];
  leads: { id: string; clientName: string; platform: string }[];
  tasks: { id: string; title: string; priority: string }[];
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length >= 2) {
      const r = globalSearch(query);
      setResults(r);
      setOpen(true);
    } else {
      setResults(null);
      setOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigate = (path: string) => {
    setOpen(false);
    setQuery('');
    router.push(path);
  };

  const totalResults = results
    ? results.entries.length + results.projects.length + results.leads.length + results.tasks.length
    : 0;

  return (
    <div className="global-search" ref={wrapRef}>
      <div className="global-search-input-wrap">
        <Search size={16} className="global-search-icon" />
        <input
          type="text"
          className="global-search-input"
          placeholder="Search everywhere..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results) setOpen(true); }}
        />
        {query && (
          <button className="global-search-clear" onClick={() => { setQuery(''); setOpen(false); }}>
            <X size={14} />
          </button>
        )}
      </div>

      {open && results && (
        <div className="global-search-dropdown">
          {totalResults === 0 ? (
            <div className="global-search-empty">No results for &ldquo;{query}&rdquo;</div>
          ) : (
            <>
              {results.entries.length > 0 && (
                <div className="global-search-section">
                  <div className="global-search-section-title"><CalendarDays size={14} /> Daily Entries</div>
                  {results.entries.slice(0, 4).map(e => (
                    <button key={e.id} className="global-search-item" onClick={() => navigate('/daily-entry')}>
                      <span className="global-search-item-text">{e.taskName}</span>
                      <span className="global-search-item-meta">{e.date} · {e.category}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.tasks.length > 0 && (
                <div className="global-search-section">
                  <div className="global-search-section-title"><ListTodo size={14} /> Tasks</div>
                  {results.tasks.slice(0, 4).map(t => (
                    <button key={t.id} className="global-search-item" onClick={() => navigate('/tasks')}>
                      <span className="global-search-item-text">{t.title}</span>
                      <span className="global-search-item-meta">{t.priority}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.projects.length > 0 && (
                <div className="global-search-section">
                  <div className="global-search-section-title"><FolderKanban size={14} /> Projects</div>
                  {results.projects.slice(0, 4).map(p => (
                    <button key={p.id} className="global-search-item" onClick={() => navigate('/projects')}>
                      <span className="global-search-item-text">{p.name}</span>
                      <span className="global-search-item-meta">{p.clientName}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.leads.length > 0 && (
                <div className="global-search-section">
                  <div className="global-search-section-title"><Users size={14} /> Leads</div>
                  {results.leads.slice(0, 4).map(l => (
                    <button key={l.id} className="global-search-item" onClick={() => navigate('/leads')}>
                      <span className="global-search-item-text">{l.clientName}</span>
                      <span className="global-search-item-meta">{l.platform}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
