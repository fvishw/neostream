// Dev: unset → '/api' (Vite proxy → localhost:5000)
// Prod: set VITE_API_URL in .env.production → e.g. https://api.neostream.com/api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  getVideos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/videos${qs ? `?${qs}` : ''}`);
  },
  getShorts: () => request('/videos/shorts'),
  getMyVideos: () => request('/videos/my'),
  getVideo: (id) => request(`/videos/${id}`),
  recordView: (id) => request(`/videos/${id}/view`, { method: 'POST' }),
  uploadVideo: (formData) => request('/videos', { method: 'POST', body: formData }),
  updateVideo: (id, body) => request(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  addComment: (videoId, content) =>
    request(`/comments/${videoId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),

  getChannel: (userId) => request(`/channels/${userId}`),
  getSubscriptions: () => request('/subscriptions/my'),
  subscribe: (channelId) => request(`/subscriptions/${channelId}`, { method: 'POST' }),
  unsubscribe: (channelId) => request(`/subscriptions/${channelId}`, { method: 'DELETE' }),
  subscriptionStatus: (channelId) => request(`/subscriptions/${channelId}/status`),

  getPlaylists: () => request('/playlists'),
  createPlaylist: (name) => request('/playlists', { method: 'POST', body: JSON.stringify({ name }) }),
  getPlaylist: (id) => request(`/playlists/${id}`),
  addToPlaylist: (playlistId, videoId) =>
    request(`/playlists/${playlistId}/videos`, { method: 'POST', body: JSON.stringify({ videoId }) }),
  removeFromPlaylist: (playlistId, videoId) =>
    request(`/playlists/${playlistId}/videos/${videoId}`, { method: 'DELETE' }),
  deletePlaylist: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),

  getHistory: () => request('/history'),
  getWatchLater: () => request('/watch-later'),
  addWatchLater: (videoId) => request(`/watch-later/${videoId}`, { method: 'POST' }),
  removeWatchLater: (videoId) => request(`/watch-later/${videoId}`, { method: 'DELETE' }),
  watchLaterStatus: (videoId) => request(`/watch-later/${videoId}/status`),

  likeVideo: (videoId) => request(`/likes/${videoId}`, { method: 'POST' }),
  unlikeVideo: (videoId) => request(`/likes/${videoId}`, { method: 'DELETE' }),
  likeStatus: (videoId) => request(`/likes/${videoId}/status`),
};
