import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

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

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.watchLater.findMany({
      where: { userId: req.user.id },
      orderBy: { addedAt: 'desc' },
      include: { video: { select: videoSelect } },
    });

    res.json({ videos: items.map((i) => i.video) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch watch later list' });
  }
});

router.post('/:videoId', authenticate, async (req, res) => {
  try {
    const video = await prisma.video.findUnique({ where: { id: req.params.videoId } });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const existing = await prisma.watchLater.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId: video.id } },
    });
    if (existing) return res.status(409).json({ error: 'Already in watch later' });

    await prisma.watchLater.create({
      data: { userId: req.user.id, videoId: video.id },
    });

    res.status(201).json({ message: 'Added to watch later', saved: true });
  } catch {
    res.status(500).json({ error: 'Failed to add to watch later' });
  }
});

router.delete('/:videoId', authenticate, async (req, res) => {
  try {
    const item = await prisma.watchLater.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId: req.params.videoId } },
    });
    if (!item) return res.status(404).json({ error: 'Not in watch later' });

    await prisma.watchLater.delete({ where: { id: item.id } });
    res.json({ message: 'Removed from watch later', saved: false });
  } catch {
    res.status(500).json({ error: 'Failed to remove from watch later' });
  }
});

router.get('/:videoId/status', authenticate, async (req, res) => {
  try {
    const item = await prisma.watchLater.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId: req.params.videoId } },
    });
    res.json({ saved: !!item });
  } catch {
    res.status(500).json({ error: 'Failed to check watch later status' });
  }
});

export default router;
