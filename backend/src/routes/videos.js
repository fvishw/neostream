import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { buildPublicUrl, createPresignedUpload, deleteFromS3, keyFromUrl } from '../utils/s3.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

const VALID_CATEGORIES = ['MUSIC', 'NEWS', 'AI', 'SOURCE_CODE', 'GAMING', 'OTHER'];
const SHORTS_MAX_DURATION = 60;
const UPLOAD_FOLDERS = {
  video: 'videos',
  thumbnail: 'thumbnails',
};

const videoSelect = {
  id: true,
  title: true,
  description: true,
  videoUrl: true,
  thumbnailUrl: true,
  duration: true,
  category: true,
  visibility: true,
  views: true,
  likeCount: true,
  createdAt: true,
  user: { select: { id: true, username: true, avatarUrl: true } },
};

function parseCategory(value) {
  if (!value) return undefined;
  const upper = value.toUpperCase().replace(/ /g, '_');
  return VALID_CATEGORIES.includes(upper) ? upper : undefined;
}

function isAllowedUploadType(kind, mimetype) {
  if (!mimetype) return false;
  if (kind === 'video') return mimetype.startsWith('video/');
  if (kind === 'thumbnail') return mimetype.startsWith('image/');
  return false;
}

function isUserUploadUrl(url, kind, userId) {
  const folder = UPLOAD_FOLDERS[kind];
  const key = keyFromUrl(url);
  return !!folder && !!key && key.startsWith(`neostream/${folder}/${userId}/`) && url === buildPublicUrl(key);
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { sort = 'latest', search, category } = req.query;
    const orderBy = {
      latest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
      views: { views: 'desc' },
      liked: { likeCount: 'desc' },
    }[sort] || { createdAt: 'desc' };

    const where = { visibility: 'PUBLIC' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const cat = parseCategory(category);
    if (cat) where.category = cat;

    const videos = await prisma.video.findMany({
      where,
      orderBy,
      select: videoSelect,
      take: 50,
    });

    res.json({ videos });
  } catch {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

router.get('/shorts', optionalAuth, async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      where: {
        visibility: 'PUBLIC',
        duration: { gt: 0, lte: SHORTS_MAX_DURATION },
      },
      orderBy: { createdAt: 'desc' },
      select: videoSelect,
      take: 50,
    });

    res.json({ videos });
  } catch {
    res.status(500).json({ error: 'Failed to fetch shorts' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: videoSelect,
    });
    res.json({ videos });
  } catch {
    res.status(500).json({ error: 'Failed to fetch your videos' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
      select: {
        ...videoSelect,
        comments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.visibility === 'PRIVATE' && video.user.id !== req.user?.id) {
      return res.status(403).json({ error: 'This video is private' });
    }

    let liked = false;
    let saved = false;
    if (req.user) {
      const [like, wl] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_videoId: { userId: req.user.id, videoId: video.id } },
        }),
        prisma.watchLater.findUnique({
          where: { userId_videoId: { userId: req.user.id, videoId: video.id } },
        }),
      ]);
      liked = !!like;
      saved = !!wl;
    }

    res.json({ video: { ...video, liked, saved } });
  } catch {
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

router.post('/:id/view', optionalAuth, async (req, res) => {
  try {
    const video = await prisma.video.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    await prisma.view.create({
      data: { videoId: video.id, userId: req.user?.id || null },
    });
    const updated = await prisma.video.update({
      where: { id: video.id },
      data: { views: { increment: 1 } },
      select: { views: true },
    });

    res.json({ views: updated.views });
  } catch {
    res.status(500).json({ error: 'Failed to record view' });
  }
});

router.post('/presign', authenticate, async (req, res) => {
  try {
    const { kind = 'video', filename, contentType } = req.body;
    const folder = UPLOAD_FOLDERS[kind];
    if (!folder) return res.status(400).json({ error: 'Invalid upload type' });
    if (!isAllowedUploadType(kind, contentType)) return res.status(400).json({ error: 'Invalid file type' });

    const upload = await createPresignedUpload({
      folder,
      userId: req.user.id,
      mimetype: contentType,
      originalname: filename,
    });

    res.json({ upload });
  } catch (err) {
    console.error('Presign error:', err);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description = '',
      visibility = 'PUBLIC',
      duration = '0',
      category = 'OTHER',
      videoUrl,
      thumbnailUrl = null,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!videoUrl) return res.status(400).json({ error: 'Video URL is required' });
    if (!isUserUploadUrl(videoUrl, 'video', req.user.id)) {
      return res.status(400).json({ error: 'Invalid video URL' });
    }
    if (thumbnailUrl && !isUserUploadUrl(thumbnailUrl, 'thumbnail', req.user.id)) {
      return res.status(400).json({ error: 'Invalid thumbnail URL' });
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        duration: Math.round(Number(duration) || 0),
        category: parseCategory(category) || 'OTHER',
        visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
        userId: req.user.id,
      },
      select: videoSelect,
    });

    res.status(201).json({ video });
  } catch (err) {
    console.error('Create video error:', err);
    res.status(500).json({ error: 'Failed to save video' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const video = await prisma.video.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { title, description, visibility, category } = req.body;
    const updated = await prisma.video.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(visibility && { visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC' }),
        ...(category && { category: parseCategory(category) || video.category }),
      },
      select: videoSelect,
    });

    res.json({ video: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const video = await prisma.video.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (video.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await Promise.all([
      deleteFromS3(video.videoUrl),
      video.thumbnailUrl ? deleteFromS3(video.thumbnailUrl) : Promise.resolve(),
    ]);

    await prisma.video.delete({ where: { id: req.params.id } });
    res.json({ message: 'Video deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export default router;
