import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration) || 0);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

async function uploadFileToS3(file, kind) {
  if (!file.type) {
    throw new Error(`Selected ${kind} file has an unknown content type`);
  }

  const { upload } = await api.createVideoUploadUrl({
    kind,
    filename: file.name,
    contentType: file.type,
  });

  const res = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload ${kind} to storage`);
  }

  return upload.publicUrl;
}

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [category, setCategory] = useState('OTHER');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <div className="p-12 text-center text-gray-500">Please sign in to upload videos.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const duration = await getVideoDuration(videoFile);
      const videoUrl = await uploadFileToS3(videoFile, 'video');
      const thumbnailUrl = thumbnailFile ? await uploadFileToS3(thumbnailFile, 'thumbnail') : null;

      const { video } = await api.uploadVideo({
        title,
        description,
        visibility,
        category,
        duration,
        videoUrl,
        thumbnailUrl,
      });
      navigate(`/watch/${video.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-3xl font-bold">Upload video</h1>
      <p className="mb-6 text-gray-500">Share your content with the world</p>

      <form onSubmit={handleSubmit} className="card-brutal space-y-5 p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Title *</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-brutal" required />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-brutal min-h-24 resize-y"
            rows={4}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Video file *</span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            className="input-brutal"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Thumbnail (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files[0])}
            className="input-brutal"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-brutal">
            <option value="MUSIC">Music</option>
            <option value="NEWS">News</option>
            <option value="AI">AI</option>
            <option value="SOURCE_CODE">Source code</option>
            <option value="GAMING">Gaming</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Visibility</span>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="input-brutal">
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}
