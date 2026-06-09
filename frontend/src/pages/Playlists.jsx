import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';

export default function Playlists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  const loadPlaylists = () => {
    api.getPlaylists()
      .then(({ playlists }) => setPlaylists(playlists))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    loadPlaylists();
  }, [user]);

  const openPlaylist = async (id) => {
    try {
      const { playlist } = await api.getPlaylist(id);
      setSelected(playlist);
      setSelectedVideos(playlist.videos);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { playlist } = await api.createPlaylist(newName);
      setPlaylists((p) => [playlist, ...p]);
      setNewName('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this playlist?')) return;
    try {
      await api.deletePlaylist(id);
      setPlaylists((p) => p.filter((pl) => pl.id !== id));
      if (selected?.id === id) {
        setSelected(null);
        setSelectedVideos([]);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) {
    return <div className="p-12 text-center text-gray-500">Please sign in to manage playlists.</div>;
  }

  if (loading) return <div className="flex justify-center p-12 font-semibold">Loading playlists...</div>;

  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Playlists</h1>
      <p className="mb-6 text-gray-500">Save videos to watch later</p>

      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <input
          type="text"
          placeholder="New playlist name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="input-brutal max-w-xs"
        />
        <button type="submit" className="btn-primary">Create</button>
      </form>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {playlists.length === 0 ? (
            <p className="text-gray-500">No playlists yet</p>
          ) : (
            playlists.map((pl) => (
              <div
                key={pl.id}
                className={`flex items-center justify-between border-2 border-brutal p-3 ${
                  selected?.id === pl.id ? 'bg-accent' : 'bg-surface'
                }`}
              >
                <button onClick={() => openPlaylist(pl.id)} className="flex-1 text-left font-semibold">
                  {pl.name}
                  <span className="ml-2 text-xs text-gray-500">({pl._count?.videos || 0})</span>
                </button>
                <button onClick={() => handleDelete(pl.id)} className="text-xs text-danger hover:underline">
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div>
          {selected ? (
            <>
              <h2 className="mb-4 text-xl font-bold">{selected.name}</h2>
              {selectedVideos.length === 0 ? (
                <p className="text-gray-500">No videos in this playlist. Save videos from the watch page.</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {selectedVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">Select a playlist to view its videos</p>
          )}
        </div>
      </div>
    </div>
  );
}
