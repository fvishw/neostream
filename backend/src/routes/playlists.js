import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { videos: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ playlists });
  } catch {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Playlist name is required' });

    const playlist = await prisma.playlist.create({
      data: { name: name.trim(), userId: req.user.id },
      include: { _count: { select: { videos: true } } },
    });
    res.status(201).json({ playlist });
  } catch {
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: req.params.id },
      include: {
        videos: {
          orderBy: { addedAt: 'desc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                duration: true,
                views: true,
                createdAt: true,
                user: { select: { id: true, username: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    res.json({
      playlist: {
        ...playlist,
        videos: playlist.videos.map((pv) => pv.video),
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

router.post('/:id/videos', authenticate, async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ error: 'Video ID is required' });

    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const existing = await prisma.playlistVideo.findUnique({
      where: { playlistId_videoId: { playlistId: playlist.id, videoId } },
    });
    if (existing) return res.status(409).json({ error: 'Video already in playlist' });

    await prisma.playlistVideo.create({
      data: { playlistId: playlist.id, videoId },
    });

    res.status(201).json({ message: 'Video added to playlist' });
  } catch {
    res.status(500).json({ error: 'Failed to add video to playlist' });
  }
});

router.delete('/:id/videos/:videoId', authenticate, async (req, res) => {
  try {
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.playlistVideo.deleteMany({
      where: { playlistId: playlist.id, videoId: req.params.videoId },
    });

    res.json({ message: 'Video removed from playlist' });
  } catch {
    res.status(500).json({ error: 'Failed to remove video from playlist' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.playlist.delete({ where: { id: req.params.id } });
    res.json({ message: 'Playlist deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

export default router;
