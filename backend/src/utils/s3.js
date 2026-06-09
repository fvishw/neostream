import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucket = () => process.env.AWS_S3_BUCKET;

function buildPublicUrl(key) {
  if (process.env.AWS_S3_PUBLIC_URL) {
    return `${process.env.AWS_S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  return `https://${bucket()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

function extFromMime(mimetype, fallback = 'bin') {
  const map = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimetype] || fallback;
}

export function keyFromUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (process.env.AWS_S3_PUBLIC_URL) {
      const base = process.env.AWS_S3_PUBLIC_URL.replace(/\/$/, '');
      if (url.startsWith(base)) return url.slice(base.length + 1);
    }
    return parsed.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

export async function uploadToS3(buffer, { folder, userId, mimetype, originalname }) {
  const ext = path.extname(originalname || '').slice(1) || extFromMime(mimetype);
  const key = `neostream/${folder}/${userId}/${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return { key, url: buildPublicUrl(key) };
}

export async function deleteFromS3(url) {
  const key = keyFromUrl(url);
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: key,
    })
  );
}
