// GitHub Contents API helpers for writing to spurs-women-photo-gallery from a
// serverless route (no local git checkout available - see WEB-148 findings
// in reference/photo-gallery/README.md ("Adding photos from a phone")). Env var names match
// the existing read-only conventions in src/lib/external-photo-loader.ts and
// scripts/generate-external-manifest.js.
const GITHUB_API_BASE = 'https://api.github.com';

function getGalleryRepoConfig() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured');
  }
  return {
    token,
    owner: process.env.EXTERNAL_REPO_OWNER || 'EllieAtWHL',
    repo: process.env.EXTERNAL_REPO_NAME || 'spurs-women-photo-gallery',
    branch: process.env.EXTERNAL_REPO_BRANCH || 'main',
  };
}

/**
 * Whether a file already exists at `path` on the configured branch. Used to
 * make photo commits idempotent: if a client retries an upload (e.g. after a
 * dropped connection), the retry finds the file already there and skips
 * re-committing instead of erroring or duplicating it.
 */
export async function galleryFileExists(path: string): Promise<boolean> {
  const { token, owner, repo, branch } = getGalleryRepoConfig();
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(`GitHub API error checking ${path}: ${response.status} ${response.statusText}`);
  }
  return true;
}

/**
 * Commits a single file into the gallery repo via the Contents API
 * (create - this is never called for a path that galleryFileExists already
 * found, so it never needs to supply a `sha` to update an existing file).
 */
export async function commitFileToGallery(
  path: string,
  base64Content: string,
  message: string
): Promise<{ htmlUrl: string; sha: string }> {
  const { token, owner, repo, branch } = getGalleryRepoConfig();
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content: base64Content, branch }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`GitHub API error committing ${path}: ${response.status} ${response.statusText} - ${JSON.stringify(body)}`);
  }
  return { htmlUrl: body.content.html_url, sha: body.content.sha };
}
