import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import commentRoutes from './routes/comments.js';
import subscriptionRoutes from './routes/subscriptions.js';
import channelRoutes from './routes/channels.js';
import playlistRoutes from './routes/playlists.js';
import historyRoutes from './routes/history.js';
import watchLaterRoutes from './routes/watchLater.js';
import likeRoutes from './routes/likes.js';
import getPrivateIP from './utils/getPrivateIp.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'ok' , message: `NeoStream API is running on ${getPrivateIP()}:${PORT}` }));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/watch-later', watchLaterRoutes);
app.use('/api/likes', likeRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, "0.0.0.0",() => {
  console.log(`NeoStream API running on http://localhost:${PORT}`);
});
