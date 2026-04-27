'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  group: string;
  snippet?: string;
}

export function FleetSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!controller.signal.aborted) {
          setResults(data.results ?? []);
          setSelectedIndex(0);
          setLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      close();
      router.push(results[selectedIndex].href);
    }
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const group = acc[r.group] ?? [];
    return { ...acc, [r.group]: [...group, r] };
  }, {});

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      <div className="search-dialog-backdrop" onClick={close} />
      <div className="search-dialog" role="dialog" aria-label="Search Fleet">
        <div className="search-dialog-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--fleet-text-muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="search-dialog-input"
            placeholder="Search pages, artifacts, projects, connections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="search-dialog-kbd">esc</kbd>
        </div>

        <div className="search-dialog-results">
          {loading && query.trim() && (
            <div className="search-dialog-empty">Searching...</div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="search-dialog-empty">No results for &ldquo;{query}&rdquo;</div>
          )}

          {!query.trim() && (
            <div className="search-dialog-empty">Search across all projects, pages, artifacts, and connections</div>
          )}

          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="search-dialog-group">
              <p className="search-dialog-group-label">{group}</p>
              {items.map((item) => {
                flatIndex++;
                const idx = flatIndex;
                return (
                  <button
                    key={item.id}
                    className={`search-dialog-item ${idx === selectedIndex ? 'search-dialog-item-selected' : ''}`}
                    onClick={() => {
                      close();
                      router.push(item.href);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="search-dialog-item-content">
                      <span className="search-dialog-item-title">{item.title}</span>
                      {item.subtitle && (
                        <span className="search-dialog-item-subtitle">{item.subtitle}</span>
                      )}
                      {item.snippet && (
                        <span className="search-dialog-item-snippet">{item.snippet}</span>
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
