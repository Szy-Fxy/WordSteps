import { useBoundStore } from '../store/boundStore';
import { useState, useRef, useEffect } from 'react';
import type { WordEntry } from '../types';

export default function SearchBar() {
  const search = useBoundStore(s => s.search);
  const clearSearch = useBoundStore(s => s.clearSearch);
  const switchLib = useBoundStore(s => s.switchLib);
  const isSearching = useBoundStore(s => s.isSearching);
  const allWords = useBoundStore(s => s.allWords);
  const wordBanks = useBoundStore(s => s.wordBanks);
  const lib = useBoundStore(s => s.lib);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WordEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 实时搜索结果
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || !allWords.length) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const matched = allWords.filter(w =>
      w.s.toLowerCase().includes(q) || w.p.toLowerCase().includes(q)
    );
    setResults(matched.slice(0, 20)); // 最多显示 20 条
    setShowResults(matched.length > 0);
  }, [query, allWords]);

  // 点击外部关闭结果列表
  useEffect(() => {
    if (!showResults) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showResults]);

  const handleSelect = (word: WordEntry) => {
    setQuery(word.s);
    setShowResults(false);
    search(word.s);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      clearSearch();
    } else {
      search(value);
    }
  };

  return (
    <div className="search-wrap" ref={wrapRef}>
      <span className="search-icon">🔍</span>
      <input
        className="search-input"
        placeholder="搜中/英文..."
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowResults(true); }}
      />
      {isSearching && (
        <button className="search-clear" onClick={() => { setQuery(''); clearSearch(); setResults([]); setShowResults(false); }}>✕</button>
      )}
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map(w => (
            <div key={w.s} className="search-result-item" onClick={() => handleSelect(w)}>
              <span className="search-result-word">{w.s}</span>
              <span className="search-result-mean">{w.p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
