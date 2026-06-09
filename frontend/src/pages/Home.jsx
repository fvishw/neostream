import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import VideoCard from '../components/VideoCard';
import { CATEGORIES } from '../utils/format';

const sortOptions = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'liked', label: 'Most Liked' },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const sort = searchParams.get('sort') || 'latest';
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    const params = { sort };
    if (search) params.search = search;
    if (category) params.category = category;
    api.getVideos(params)
      .then(({ videos }) => setVideos(videos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sort, search, category]);

  const handleSort = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    setSearchParams(params);
  };

  const handleCategory = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('category', value);
    else params.delete('category');
    setSearchParams(params);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => handleCategory(cat.value)}
            className={`whitespace-nowrap border-2 border-brutal px-4 py-1.5 text-sm font-semibold ${
              category === cat.value ? 'bg-accent shadow-[var(--shadow-brutal-sm)]' : 'bg-surface'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {search ? `Results for "${search}"` : 'Chill Videos'}
          </h1>
          <p className="text-gray-500">{videos.length} videos</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={`border-2 border-brutal px-3 py-1 text-xs ${
                sort === opt.value ? 'bg-accent font-bold shadow-[var(--shadow-brutal-sm)]' : 'bg-surface'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 font-semibold">Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="p-12 text-center text-gray-500">No videos found. Be the first to upload!</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
