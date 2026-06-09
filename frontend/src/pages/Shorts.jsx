import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { formatViews, formatLikes } from '../utils/format';

export default function Shorts() {
  const [videos, setVideos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getShorts()
      .then(({ videos }) => setVideos(videos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = videos[activeIndex];

  if (loading) return <div className="flex justify-center p-12 font-semibold">Loading shorts...</div>;

  if (videos.length === 0) {
    return (
      <div className="p-12 text-center">
        <h1 className="mb-2 text-2xl font-bold">Shorts</h1>
        <p className="text-gray-500">No short videos yet (videos under 60 seconds appear here)</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center">
      <h1 className="mb-4 self-start text-2xl font-bold">Shorts</h1>

      <div className="card-brutal relative w-full overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '75vh' }}>
        <video
          key={active.id}
          src={active.videoUrl}
          controls
          autoPlay
          className="h-full w-full object-cover"
          poster={active.thumbnailUrl}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
          <Link to={`/channel/${active.user.id}`} className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-white bg-accent font-bold text-brutal">
              {active.user.username.charAt(0)}
            </div>
            <span className="font-bold">{active.user.username}</span>
          </Link>
          <Link to={`/watch/${active.id}`} className="block">
            <h2 className="mb-1 font-bold">{active.title}</h2>
          </Link>
          <p className="text-xs opacity-80">
            {formatViews(active.views)} · {formatLikes(active.likeCount || 0)} likes
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          disabled={activeIndex === 0}
          className="btn-primary text-sm"
        >
          ↑ Prev
        </button>
        <span className="flex items-center text-sm text-gray-500">
          {activeIndex + 1} / {videos.length}
        </span>
        <button
          onClick={() => setActiveIndex((i) => Math.min(videos.length - 1, i + 1))}
          disabled={activeIndex === videos.length - 1}
          className="btn-primary text-sm"
        >
          ↓ Next
        </button>
      </div>
    </div>
  );
}
