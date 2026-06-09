import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { timeAgo } from '../utils/format';

export default function History() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getHistory()
      .then(({ videos }) => setVideos(videos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="p-12 text-center">
        <p className="mb-4 text-gray-500">Sign in to see your watch history</p>
        <Link to="/login" className="btn-primary">Sign in</Link>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center p-12 font-semibold">Loading history...</div>;

  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">History</h1>
      <p className="mb-6 text-gray-500">Videos you&apos;ve watched</p>

      {videos.length === 0 ? (
        <div className="p-12 text-center text-gray-500">No watch history yet. Start watching!</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {videos.map((video) => (
            <div key={video.id}>
              <VideoCard video={video} />
              {video.watchedAt && (
                <p className="mt-1 text-xs text-gray-500">Watched {timeAgo(video.watchedAt)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
