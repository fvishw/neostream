import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/:videoId', authenticate, async (req, res) => {
  try {
    const video = await prisma.video.findUnique({ where: { id: req.params.videoId } });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const existing = await prisma.like.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId: video.id } },
    });
    if (existing) return res.status(409).json({ error: 'Already liked' });

    await prisma.$transaction([
      prisma.like.create({ data: { userId: req.user.id, videoId: video.id } }),
      prisma.video.update({
        where: { id: video.id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    const updated = await prisma.video.findUnique({
      where: { id: video.id },
      select: { likeCount: true },
    });

    res.status(201).json({ liked: true, likeCount: updated.likeCount });
  } catch {
    res.status(500).json({ error: 'Failed to like video' });
  }
});

router.delete('/:videoId', authenticate, async (req, res) => {
  try {
    const like = await prisma.like.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId: req.params.videoId } },
    });
    if (!like) return res.status(404).json({ error: 'Not liked' });

    await prisma.$transaction([
      prisma.like.delete({ where: { id: like.id } }),
      prisma.video.update({
        where: { id: req.params.videoId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    const updated = await prisma.video.findUnique({
      where: { id: req.params.videoId },
      select: { likeCount: true },
    });

    res.json({ liked: false, likeCount: updated.likeCount });
  } catch {
    res.status(500).json({ error: 'Failed to unlike video' });
  }
});

router.get('/:videoId/status', authenticate, async (req, res) => {
  try {
    const like = await prisma.like.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId: req.params.videoId } },
    });
    res.json({ liked: !!like });
  } catch {
    res.status(500).json({ error: 'Failed to check like status' });
  }
});

export default router;
