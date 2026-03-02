import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Prevent directory traversal attacks
  const filePath = path.join(process.cwd(), 'content', ...segments);
  const contentBase = path.join(process.cwd(), 'content');
  if (!filePath.startsWith(contentBase)) {
    return new Response('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const file = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  return new Response(file, {
    headers: {
      'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
