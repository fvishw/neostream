import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/:videoId', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment content is required' });

    const video = await prisma.video.findUnique({ where: { id: req.params.videoId } });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const comment = await prisma.comment.create({
      data: { content: content.trim(), userId: req.user.id, videoId: req.params.videoId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ comment });
  } catch {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comment deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
