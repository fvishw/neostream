import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatViews } from '../utils/format';
import VideoCard from '../components/VideoCard';

export default function Channel() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getChannel(userId)
      .then(({ channel, videos }) => {
        setChannel(channel);
        setVideos(videos);
        setSubscribed(channel.subscribed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      if (subscribed) {
        await api.unsubscribe(channel.id);
        setSubscribed(false);
      } else {
        await api.subscribe(channel.id);
        setSubscribed(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (videoId) => {
    if (!confirm('Delete this video?')) return;
    try {
      await api.deleteVideo(videoId);
      setVideos((v) => v.filter((vid) => vid.id !== videoId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleVisibility = async (video) => {
    const next = video.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    try {
      const { video: updated } = await api.updateVideo(video.id, { visibility: next });
      setVideos((v) => v.map((vid) => (vid.id === video.id ? { ...vid, visibility: updated.visibility } : vid)));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-12 font-semibold">Loading channel...</div>;
  if (!channel) return <div className="p-12 text-center text-gray-500">Channel not found</div>;

  return (
    <div>
      <div className="card-brutal mb-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center border-2 border-brutal bg-accent text-3xl font-bold">
            {channel.username.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{channel.username}</h1>
            <p className="text-sm text-gray-500">
              {channel.subscriberCount} subscribers · {channel.videoCount} videos · {formatViews(channel.totalViews)}
            </p>
          </div>
        </div>
        {user && user.id !== channel.id && (
          <button
            onClick={handleSubscribe}
            className={`btn-brutal px-6 py-2 shadow-[var(--shadow-brutal-sm)] ${
              subscribed ? 'bg-gray-200' : 'bg-brutal text-white'
            }`}
          >
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      <h2 className="mb-4 text-xl font-bold">
        {channel.isOwner ? 'Your videos' : 'Videos'} ({videos.length})
      </h2>

      {videos.length === 0 ? (
        <div className="p-12 text-center text-gray-500">No videos yet</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {videos.map((video) => (
            <div key={video.id} className="relative">
              <VideoCard video={video} />
              {channel.isOwner && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleToggleVisibility(video)}
                    className="btn-ghost text-xs"
                  >
                    {video.visibility === 'PUBLIC' ? 'Make Private' : 'Make Public'}
                  </button>
                  <button onClick={() => handleDelete(video.id)} className="btn-danger text-xs">
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
