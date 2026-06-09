import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatViews } from '../utils/format';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/shorts', label: 'Shorts', icon: '⚡' },
];

const youItems = [
  { to: '/my-channel', label: 'Your channel', icon: '📺' },
  { to: '/history', label: 'History', icon: '🕐' },
  { to: '/playlists', label: 'Playlists', icon: '📋' },
  { to: '/watch-later', label: 'Watch later', icon: '⏰' },
];

function linkClass(active) {
  return `mb-0.5 flex items-center gap-3 border-2 px-3 py-2.5 font-medium transition-colors ${
    active
      ? 'border-brutal bg-accent font-bold shadow-[var(--shadow-brutal-sm)]'
      : 'border-transparent hover:border-brutal hover:bg-cream'
  }`;
}

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.getSubscriptions()
      .then(({ subscriptions }) => setSubscriptions(subscriptions.slice(0, 5)))
      .catch(() => {});
  }, [user]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r-2 border-brutal bg-surface py-4 lg:block">
      <nav className="mb-2 border-b-2 border-brutal px-3 pb-2">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to} className={linkClass(isActive(item.to))}>
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}
      </nav>

      {user && (
        <div className="mb-2 border-b-2 border-brutal px-3 pb-2">
          <h3 className="px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">You</h3>
          {youItems.map((item) => (
            <Link
              key={item.label}
              to={item.to === '/my-channel' ? `/channel/${user.id}` : item.to}
              className={linkClass(isActive(item.to))}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mb-2 border-b-2 border-brutal px-3 pb-2">
        <h3 className="px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">Explore</h3>
        <Link to="/?sort=views" className={linkClass(false)}>
          <span>🔥</span> Trending
        </Link>
      </div>

      {subscriptions.length > 0 && (
        <div className="px-3">
          <h3 className="px-3 py-2 text-[0.7rem] font-bold uppercase tracking-wider text-gray-500">Subscriptions</h3>
          {subscriptions.map((ch) => (
            <Link key={ch.id} to={`/channel/${ch.id}`} className="mb-0.5 flex items-center gap-2.5 px-3 py-2 hover:bg-cream">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-brutal bg-accent text-sm font-bold">
                {ch.username.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{ch.username}</p>
                <p className="text-xs text-gray-500">
                  {formatViews(ch.totalViews)} · {ch.videoCount} videos
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
