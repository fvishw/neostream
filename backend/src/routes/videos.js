import { Router } from 'express';
import multer from 'multer';
import prisma from '../utils/prisma.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const VALID_CATEGORIES = ['MUSIC', 'NEWS', 'AI', 'SOURCE_CODE', 'GAMING', 'OTHER'];
const SHORTS_MAX_DURATION = 60;

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

router.post('/', authenticate, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req, res) => {
  try {
    const { title, description = '', visibility = 'PUBLIC', duration = '0', category = 'OTHER' } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!req.files?.video?.[0]) return res.status(400).json({ error: 'Video file is required' });

    const videoFile = req.files.video[0];
    const videoResult = await uploadToS3(videoFile.buffer, {
      folder: 'videos',
      userId: req.user.id,
      mimetype: videoFile.mimetype,
      originalname: videoFile.originalname,
    });

    let thumbnailUrl = null;
    if (req.files.thumbnail?.[0]) {
      const thumbFile = req.files.thumbnail[0];
      const thumbResult = await uploadToS3(thumbFile.buffer, {
        folder: 'thumbnails',
        userId: req.user.id,
        mimetype: thumbFile.mimetype,
        originalname: thumbFile.originalname,
      });
      thumbnailUrl = thumbResult.url;
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl: videoResult.url,
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
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload video' });
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
