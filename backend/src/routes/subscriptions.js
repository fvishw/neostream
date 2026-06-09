import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/my', authenticate, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: req.user.id },
      include: {
        channel: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            _count: { select: { videos: true, subscribers: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const channels = await Promise.all(
      subscriptions.map(async (sub) => {
        const totalViews = await prisma.video.aggregate({
          where: { userId: sub.channel.id, visibility: 'PUBLIC' },
          _sum: { views: true },
        });
        return {
          ...sub.channel,
          videoCount: sub.channel._count.videos,
          subscriberCount: sub.channel._count.subscribers,
          totalViews: totalViews._sum.views || 0,
          subscribedAt: sub.createdAt,
        };
      })
    );

    res.json({ subscriptions: channels });
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

router.post('/:channelId', authenticate, async (req, res) => {
  try {
    const channelId = req.params.channelId;
    if (channelId === req.user.id) {
      return res.status(400).json({ error: 'Cannot subscribe to yourself' });
    }

    const channel = await prisma.user.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const existing = await prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId: req.user.id, channelId } },
    });
    if (existing) return res.status(409).json({ error: 'Already subscribed' });

    await prisma.subscription.create({
      data: { subscriberId: req.user.id, channelId },
    });

    res.status(201).json({ message: 'Subscribed', subscribed: true });
  } catch {
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

router.delete('/:channelId', authenticate, async (req, res) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: { subscriberId: req.user.id, channelId: req.params.channelId },
      },
    });
    if (!sub) return res.status(404).json({ error: 'Not subscribed' });

    await prisma.subscription.delete({ where: { id: sub.id } });
    res.json({ message: 'Unsubscribed', subscribed: false });
  } catch {
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

router.get('/:channelId/status', authenticate, async (req, res) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: { subscriberId: req.user.id, channelId: req.params.channelId },
      },
    });
    res.json({ subscribed: !!sub });
  } catch {
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

export default router;
