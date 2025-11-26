import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Pole } from '@/types';
import { searchPoles } from '@/utils/graphHelpers';
import { NODE_CONFIG } from '@/constants/config';

interface SearchBarProps {
  poles: Pole[];
  onSelectPole: (pole: Pole) => void;
}

export function SearchBar({ poles, onSelectPole }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredPoles = useMemo(() => {
    if (!query.trim()) return poles;
    return searchPoles(query, poles, poles.length);
  }, [query, poles]);

  const rowVirtualizer = useVirtualizer({
    count: filteredPoles.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  useEffect(() => {
    setSelectedIndex(0);
    rowVirtualizer.scrollToIndex(0);
  }, [query, rowVirtualizer]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((pole: Pole) => {
    onSelectPole(pole);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onSelectPole]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => {
          const next = Math.min(i + 1, filteredPoles.length - 1);
          rowVirtualizer.scrollToIndex(next);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => {
          const next = Math.max(i - 1, 0);
          rowVirtualizer.scrollToIndex(next);
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPoles[selectedIndex]) {
          handleSelect(filteredPoles[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, filteredPoles, selectedIndex, handleSelect, rowVirtualizer]);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un thème ou laboratoire..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg
                     text-slate-200 placeholder-slate-500
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                     transition-colors"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-500">
            {filteredPoles.length} résultat{filteredPoles.length > 1 ? 's' : ''}
          </div>

          <div
            ref={listRef}
            className="max-h-64 overflow-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const pole = filteredPoles[virtualItem.index];
                const isSelected = virtualItem.index === selectedIndex;

                return (
                  <button
                    key={pole.id}
                    onClick={() => handleSelect(pole)}
                    onMouseEnter={() => setSelectedIndex(virtualItem.index)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className={`
                      px-4 py-2 text-left flex items-center gap-3
                      transition-colors
                      ${isSelected ? 'bg-blue-600/30' : 'hover:bg-slate-700/50'}
                    `}
                  >
                    <span
                      className={`
                        w-3 h-3 flex-shrink-0
                        ${pole.type === 'theme' ? 'rounded-full' : 'rounded-sm'}
                      `}
                      style={{ backgroundColor: NODE_CONFIG[pole.type].color }}
                    />
                    <span className="text-slate-200 truncate flex-1">{pole.nom}</span>
                    <span className="text-xs text-slate-500 capitalize flex-shrink-0">
                      {pole.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredPoles.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              Aucun résultat trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}
