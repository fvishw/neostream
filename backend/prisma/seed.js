import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);

  const hitesh = await prisma.user.upsert({
    where: { email: 'hitesh@neostream.com' },
    update: {},
    create: {
      username: 'Hitesh Choudhary',
      email: 'hitesh@neostream.com',
      password,
      avatarUrl: null,
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@neostream.com' },
    update: {},
    create: {
      username: 'Demo User',
      email: 'demo@neostream.com',
      password,
    },
  });

  const sampleVideos = [
    {
      title: 'Flutter Windows Installation',
      description: 'Complete guide to installing Flutter on Windows for cross-platform development.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
      duration: 815,
      views: 3000,
      likeCount: 245,
      category: 'SOURCE_CODE',
      userId: hitesh.id,
    },
    {
      title: 'React Hooks Deep Dive',
      description: 'Understanding useState, useEffect, and custom hooks in React.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Elephants_Dream_s1_proog.jpg/320px-Elephants_Dream_s1_proog.jpg',
      duration: 620,
      views: 12500,
      likeCount: 890,
      category: 'SOURCE_CODE',
      userId: hitesh.id,
    },
    {
      title: 'Node.js Express API Tutorial',
      description: 'Build REST APIs with Express and PostgreSQL from scratch.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: null,
      duration: 15,
      views: 8700,
      likeCount: 412,
      category: 'AI',
      userId: hitesh.id,
    },
    {
      title: 'PostgreSQL for Beginners',
      description: 'Learn database fundamentals with PostgreSQL and Prisma ORM.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: null,
      duration: 15,
      views: 5200,
      likeCount: 318,
      category: 'NEWS',
      userId: hitesh.id,
    },
    {
      title: 'Quick CSS Grid Tip',
      description: 'A 30-second tip for responsive layouts.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: null,
      duration: 60,
      views: 2100,
      likeCount: 156,
      category: 'GAMING',
      userId: hitesh.id,
    },
    {
      title: 'AI Prompt Engineering Basics',
      description: 'Short intro to writing better AI prompts.',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      thumbnailUrl: null,
      duration: 45,
      views: 9800,
      likeCount: 720,
      category: 'AI',
      userId: hitesh.id,
    },
  ];

  for (const v of sampleVideos) {
    const existing = await prisma.video.findFirst({ where: { title: v.title } });
    if (!existing) {
      await prisma.video.create({ data: v });
    }
  }

  await prisma.subscription.upsert({
    where: { subscriberId_channelId: { subscriberId: demo.id, channelId: hitesh.id } },
    update: {},
    create: { subscriberId: demo.id, channelId: hitesh.id },
  });

  console.log('Seed complete!');
  console.log('Demo accounts: hitesh@neostream.com / demo@neostream.com (password: password123)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
