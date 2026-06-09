import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

export default function WatchLater() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getWatchLater()
      .then(({ videos }) => setVideos(videos))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const handleRemove = async (videoId) => {
    try {
      await api.removeWatchLater(videoId);
      setVideos((v) => v.filter((vid) => vid.id !== videoId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="p-12 text-center">
        <p className="mb-4 text-gray-500">Sign in to save videos for later</p>
        <Link to="/login" className="btn-primary">Sign in</Link>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center p-12 font-semibold">Loading...</div>;

  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Watch Later</h1>
      <p className="mb-6 text-gray-500">{videos.length} saved videos</p>

      {videos.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          No saved videos. Click the clock icon on any video to save it here.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {videos.map((video) => (
            <div key={video.id}>
              <VideoCard video={video} />
              <button
                onClick={() => handleRemove(video.id)}
                className="mt-2 text-xs font-semibold text-danger hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
