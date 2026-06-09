import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatViews, formatLikes, timeAgo } from '../utils/format';

export default function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getVideo(id)
      .then(({ video }) => {
        setVideo(video);
        setLiked(video.liked || false);
        setSaved(video.saved || false);
        api.recordView(id).catch(() => {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !video) return;
    api.subscriptionStatus(video.user.id)
      .then(({ subscribed }) => setSubscribed(subscribed))
      .catch(() => {});
    api.getPlaylists()
      .then(({ playlists }) => setPlaylists(playlists))
      .catch(() => {});
  }, [user, video]);

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      if (subscribed) {
        await api.unsubscribe(video.user.id);
        setSubscribed(false);
      } else {
        await api.subscribe(video.user.id);
        setSubscribed(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        const { likeCount } = await api.unlikeVideo(id);
        setLiked(false);
        setVideo((v) => ({ ...v, likeCount }));
      } else {
        const { likeCount } = await api.likeVideo(id);
        setLiked(true);
        setVideo((v) => ({ ...v, likeCount }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleWatchLater = async () => {
    if (!user) return;
    try {
      if (saved) {
        await api.removeWatchLater(id);
        setSaved(false);
      } else {
        await api.addWatchLater(id);
        setSaved(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    setSubmitting(true);
    try {
      const { comment: newComment } = await api.addComment(id, comment);
      setVideo((v) => ({ ...v, comments: [newComment, ...v.comments] }));
      setComment('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.deleteComment(commentId);
      setVideo((v) => ({
        ...v,
        comments: v.comments.filter((c) => c.id !== commentId),
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      await api.addToPlaylist(playlistId, id);
      setShowPlaylistMenu(false);
      alert('Added to playlist!');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex justify-center p-12 font-semibold">Loading video...</div>;
  if (error) return <div className="p-12 text-center text-gray-500">{error}</div>;
  if (!video) return null;

  return (
    <div className="max-w-4xl">
      <div className="card-brutal mb-4 overflow-hidden">
        <video
          src={video.videoUrl}
          controls
          autoPlay
          className="w-full"
          poster={video.thumbnailUrl}
        />
      </div>

      <h1 className="mb-3 text-2xl font-bold">{video.title}</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {formatViews(video.views)} · {formatLikes(video.likeCount || 0)} likes · {timeAgo(video.createdAt)}
        </p>
        <div className="flex flex-wrap gap-2">
          {user ? (
            <>
              <button
                onClick={handleLike}
                className={`btn-brutal px-4 py-2 text-sm shadow-[var(--shadow-brutal-sm)] ${
                  liked ? 'bg-accent' : 'bg-surface'
                }`}
              >
                👍 {liked ? 'Liked' : 'Like'}
              </button>
              <button
                onClick={handleWatchLater}
                className={`btn-brutal px-4 py-2 text-sm shadow-[var(--shadow-brutal-sm)] ${
                  saved ? 'bg-accent' : 'bg-surface'
                }`}
              >
                ⏰ {saved ? 'Saved' : 'Watch later'}
              </button>
              <div className="relative">
                <button className="btn-primary text-sm" onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}>
                  + Playlist
                </button>
                {showPlaylistMenu && (
                  <div className="card-brutal absolute right-0 top-full z-10 mt-2 min-w-48 p-2">
                    {playlists.length === 0 ? (
                      <p className="px-2 py-1 text-sm text-gray-500">No playlists yet</p>
                    ) : (
                      playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => handleAddToPlaylist(pl.id)}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-cream"
                        >
                          {pl.name}
                        </button>
                      ))
                    )}
                    <Link to="/playlists" className="block px-3 py-2 text-sm text-gray-600 hover:bg-cream">
                      Manage playlists →
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm">Sign in to interact</Link>
          )}
        </div>
      </div>

      <div className="card-brutal mb-4 flex items-center justify-between p-4">
        <Link to={`/channel/${video.user.id}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-brutal bg-accent font-bold">
            {video.user.username.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold">{video.user.username}</h3>
        </Link>
        {user && user.id !== video.user.id && (
          <button
            onClick={handleSubscribe}
            className={`btn-brutal px-5 py-2 shadow-[var(--shadow-brutal-sm)] ${
              subscribed ? 'bg-gray-200' : 'bg-brutal text-white'
            }`}
          >
            {subscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      {video.description && (
        <div className="card-brutal mb-6 p-4">
          <p className="text-sm leading-relaxed">{video.description}</p>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold">{video.comments.length} Comments</h2>

        {user ? (
          <form onSubmit={handleComment} className="mb-6 flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-brutal bg-accent font-bold">
              {user.username.charAt(0)}
            </div>
            <div className="flex flex-1 gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-brutal flex-1"
              />
              <button type="submit" className="btn-primary" disabled={!comment.trim() || submitting}>
                Comment
              </button>
            </div>
          </form>
        ) : (
          <p className="mb-6 text-sm text-gray-500">
            <Link to="/login" className="font-semibold underline">Sign in</Link> to comment
          </p>
        )}

        <div className="space-y-4">
          {video.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-brutal bg-accent text-sm font-bold">
                {c.user.username.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <strong>{c.user.username}</strong>
                  <span className="text-gray-500">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm">{c.content}</p>
                {user?.id === c.user.id && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="mt-1 text-xs font-semibold text-danger hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
