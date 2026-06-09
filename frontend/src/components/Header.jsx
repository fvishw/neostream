import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="z-50 flex shrink-0 items-center gap-6 border-b-2 border-brutal bg-surface px-6 py-3">
      <Link to="/" className="flex shrink-0 items-center gap-1.5 text-xl font-bold">
        <span className="text-danger">▶</span>
        <span>NeoStream</span>
      </Link>

      <form className="mx-auto flex max-w-xl flex-1 max-md:hidden" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-brutal flex-1 border-r-0"
        />
        <button type="submit" className="btn-primary border-l-0 px-4 text-lg" aria-label="Search">
          🔍
        </button>
      </form>

      <div className="flex shrink-0 items-center gap-3">
        {user ? (
          <>
            <Link to="/upload" className="btn-primary text-sm">Upload</Link>
            <div className="flex items-center gap-2">
              <Link
                to={`/channel/${user.id}`}
                className="flex h-9 w-9 items-center justify-center border-2 border-brutal bg-accent font-bold shadow-[var(--shadow-brutal-sm)]"
              >
                {user.username.charAt(0).toUpperCase()}
              </Link>
              <button onClick={logout} className="btn-ghost text-sm">Sign out</button>
            </div>
          </>
        ) : (
          <Link to="/login" className="btn-primary flex items-center gap-1.5 text-sm">
            👤 Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
