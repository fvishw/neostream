import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { videos: true, subscribers: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Channel not found' });

    const isOwner = req.user?.id === user.id;
    const videos = await prisma.video.findMany({
      where: {
        userId: user.id,
        ...(isOwner ? {} : { visibility: 'PUBLIC' }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        duration: true,
        views: true,
        visibility: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const totalViews = await prisma.video.aggregate({
      where: { userId: user.id, ...(isOwner ? {} : { visibility: 'PUBLIC' }) },
      _sum: { views: true },
    });

    let subscribed = false;
    if (req.user && req.user.id !== user.id) {
      const sub = await prisma.subscription.findUnique({
        where: {
          subscriberId_channelId: { subscriberId: req.user.id, channelId: user.id },
        },
      });
      subscribed = !!sub;
    }

    res.json({
      channel: {
        ...user,
        videoCount: user._count.videos,
        subscriberCount: user._count.subscribers,
        totalViews: totalViews._sum.views || 0,
        subscribed,
        isOwner,
      },
      videos,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

export default router;
