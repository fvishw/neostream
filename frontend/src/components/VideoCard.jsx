import { Link } from 'react-router-dom';
import { formatViews, formatDuration, timeAgo } from '../utils/format';

export default function VideoCard({ video }) {
  return (
    <Link
      to={`/watch/${video.id}`}
      className="block border-2 border-brutal bg-surface shadow-[var(--shadow-brutal)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-300">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#e8e0d4] text-3xl text-gray-500">▶</div>
        )}
        {video.duration > 0 && (
          <span className="absolute bottom-1.5 right-1.5 border border-white bg-black/85 px-1.5 py-0.5 text-xs font-semibold text-white">
            {formatDuration(video.duration)}
          </span>
        )}
        {video.visibility === 'PRIVATE' && (
          <span className="absolute left-1.5 top-1.5 border-2 border-brutal bg-accent px-1.5 py-0.5 text-xs font-bold">
            🔒 Private
          </span>
        )}
      </div>
      <div className="flex gap-3 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-brutal bg-accent font-bold">
          {video.user?.username?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug">{video.title}</h3>
          <p className="text-xs text-gray-500">{video.user?.username}</p>
          <p className="text-xs text-gray-500">
            {formatViews(video.views)} · {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
