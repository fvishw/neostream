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
    const views = await prisma.view.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      distinct: ['videoId'],
      include: {
        video: { select: videoSelect },
      },
      take: 50,
    });

    const videos = views
      .map((v) => ({ ...v.video, watchedAt: v.createdAt }))
      .filter((v) => v.visibility === 'PUBLIC' || v.user?.id === req.user.id);

    res.json({ videos });
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
