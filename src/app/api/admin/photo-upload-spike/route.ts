import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { handleApiError } from '@/lib/admin-api';

// WEB-148 spike: proves a single photo can go phone -> sharp -> committed into
// spurs-women-photo-gallery without any local CLI step. Auth/CSRF/rate-limit
// are already enforced for every /api/admin/* route in
// src/lib/supabase/middleware.ts - this route adds nothing on top of that.
//
// Deliberately narrow (see WEB-148 "explicitly out of scope"): one photo per
// request, Contents API only (no Git Data API), no `media` table write. The
// full batch-upload/admin-UI feature is a separate follow-up issue.

// sharp's native bindings need the Node.js runtime, not the Edge runtime.
export const runtime = 'nodejs';
// Generous cap while we find out in practice how long resize+commit actually
// takes on Vercel - see the WEB-148 findings for what this should settle to.
export const maxDuration = 60;

// Commits land under this top-level folder rather than a real season, so
// spike test photos never show up as a bogus gallery entry - see the matching
// NON_GALLERY_FOLDERS entry in scripts/generate-external-manifest.js.
const SPIKE_TEST_FOLDER = '_spike-test';

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;
const TARGET_MAX_BYTES = 500 * 1024;

function getCdnUrl(filePath: string): string {
  const owner = process.env.EXTERNAL_REPO_OWNER || 'EllieAtWHL';
  const repo = process.env.EXTERNAL_REPO_NAME || 'spurs-women-photo-gallery';
  const branch = process.env.EXTERNAL_REPO_BRANCH || 'main';
  const provider = process.env.CDN_PROVIDER || 'jsdelivr';
  const baseUrl = process.env.CDN_BASE_URL || 'https://cdn.jsdelivr.net';

  switch (provider) {
    case 'jsdelivr':
      return `${baseUrl}/gh/${owner}/${repo}@${branch}/${filePath}`;
    case 'unpkg':
      return `https://unpkg.com/${repo}@${branch}/${filePath}`;
    case 'statically':
      return `https://cdn.statically.io/gh/${owner}/${repo}/${branch}/${filePath}`;
    default:
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  }
}

async function commitToGitHub(filePath: string, base64Content: string, message: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured');
  }
  const owner = process.env.EXTERNAL_REPO_OWNER || 'EllieAtWHL';
  const repo = process.env.EXTERNAL_REPO_NAME || 'spurs-women-photo-gallery';
  const branch = process.env.EXTERNAL_REPO_BRANCH || 'main';

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: base64Content,
      branch,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${JSON.stringify(body)}`);
  }
  return body as { content: { html_url: string; sha: string; path: string } };
}

export async function POST(request: NextRequest) {
  const totalStart = Date.now();

  try {
    const formData = await request.formData();
    const photo = formData.get('photo');

    if (!photo || !(photo instanceof File)) {
      return NextResponse.json({ error: 'Missing "photo" file in form data' }, { status: 400 });
    }
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: `Expected an image, got "${photo.type}"` }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await photo.arrayBuffer());

    const resizeStart = Date.now();
    const optimisedBuffer = await sharp(originalBuffer)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .rotate() // apply EXIF orientation before stripping metadata, matching `-strip` in the ImageMagick pipeline
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    const resizeDurationMs = Date.now() - resizeStart;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `${SPIKE_TEST_FOLDER}/${timestamp}/test-upload.webp`;

    const commitStart = Date.now();
    const commitResult = await commitToGitHub(
      filePath,
      optimisedBuffer.toString('base64'),
      `WEB-148 spike: test upload ${timestamp}`
    );
    const commitDurationMs = Date.now() - commitStart;

    return NextResponse.json({
      success: true,
      path: filePath,
      githubHtmlUrl: commitResult.content.html_url,
      githubSha: commitResult.content.sha,
      cdnUrl: getCdnUrl(filePath),
      cdnNote: 'CDN URL may not resolve immediately - it depends on the gallery repo\'s update-manifest.yml webhook and jsDelivr cache purge/propagation.',
      metrics: {
        originalSizeBytes: originalBuffer.length,
        optimisedSizeBytes: optimisedBuffer.length,
        underTargetSize: optimisedBuffer.length < TARGET_MAX_BYTES,
        resizeDurationMs,
        commitDurationMs,
        totalDurationMs: Date.now() - totalStart,
      },
    });
  } catch (error) {
    return NextResponse.json(handleApiError(error, 'Photo upload spike failed'), { status: 500 });
  }
}
