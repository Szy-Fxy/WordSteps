import { useBoundStore } from '../store/boundStore';
import { useState } from 'react';

export default function SearchBar() {
  const search = useBoundStore(s => s.search);
  const clearSearch = useBoundStore(s => s.clearSearch);
  const isSearching = useBoundStore(s => s.isSearching);
  const [query, setQuery] = useState('');

  return (
    <div className="search-wrap">
      <span className="search-icon">🔍</span>
      <input
        className="search-input"
        placeholder="搜中/英文..."
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          search(e.target.value);
        }}
      />
      {isSearching && (
        <button className="search-clear" onClick={() => { setQuery(''); clearSearch(); }}>✕</button>
      )}
    </div>
  );
}
