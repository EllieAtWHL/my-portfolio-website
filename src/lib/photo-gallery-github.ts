// Git Data API helpers for writing to spurs-women-photo-gallery from a
// serverless route (no local git checkout available - see
// reference/photo-gallery/README.md "Adding photos from a phone").
//
// Deliberately NOT the simpler Contents API (one PUT per file, each its own
// commit+push to `main`): a real WEB-149 upload batch of ~14 photos pushed
// 14 separate commits to the gallery repo's `main`, and since that repo's
// update-manifest.yml webhook fires on every push to main, that meant 14
// separate workflow runs each opening their own auto-merging PR against
// this repo - several of which piled up as genuine duplicates/near-
// duplicates, congesting CI/Vercel and needing manual cleanup. Committing
// each photo as a git blob (see createBlob) doesn't touch any ref or
// trigger anything; only finalizeGalleryBatch's single tree+commit+ref
// update actually pushes to `main`, so an entire album fires the webhook
// exactly once, matching how the desktop pipeline already behaves (one
// `git push` per publish-match-photos.js run).
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

async function githubRequest(path: string, init?: RequestInit) {
  const { token } = getGalleryRepoConfig();
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`GitHub API error (${path}): ${response.status} ${response.statusText} - ${JSON.stringify(body)}`);
  }
  return body;
}

/**
 * Creates a git blob from base64-encoded content. This is a pure data-object
 * write with no ref/branch involved - safe to call once per photo as it's
 * processed, and safe to retry (identical content always hashes to the same
 * blob sha, so a retry is a cheap no-op, not a duplicate).
 */
export async function createBlob(base64Content: string): Promise<string> {
  const { owner, repo } = getGalleryRepoConfig();
  const body = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content: base64Content, encoding: 'base64' }),
  });
  return body.sha as string;
}

export interface GalleryBlobEntry {
  path: string;
  sha: string;
}

/**
 * Builds one tree on top of the branch's current HEAD containing all the
 * given blobs, then creates a single commit and moves the branch ref to it -
 * one push, one webhook trigger, regardless of how many photos are in
 * `blobs`. Idempotent: if none of the blobs actually change the tree (e.g.
 * this is a retry of an already-finalized batch), no commit or ref update is
 * made at all.
 */
export async function finalizeGalleryBatch(
  blobs: GalleryBlobEntry[],
  message: string
): Promise<{ skipped: boolean; commitSha: string }> {
  const { owner, repo, branch } = getGalleryRepoConfig();

  const ref = await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branch}`);
  const headCommitSha = ref.object.sha as string;

  const headCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${headCommitSha}`);
  const baseTreeSha = headCommit.tree.sha as string;

  const newTree = await githubRequest(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: blobs.map((blob) => ({ path: blob.path, mode: '100644', type: 'blob', sha: blob.sha })),
    }),
  });

  if (newTree.sha === baseTreeSha) {
    // Every blob already matches what's on the branch - a retried/duplicate
    // finalize call for a batch that already landed. Skip creating an
    // empty commit (which would still push and re-trigger the webhook for
    // no actual content change).
    return { skipped: true, commitSha: headCommitSha };
  }

  const newCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [headCommitSha] }),
  });

  try {
    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha }),
    });
  } catch (error) {
    // The branch moved between our GET and this PATCH (e.g. a concurrent
    // finalize, vanishingly unlikely for a single-admin tool, or a manual
    // push) - surface a clear, retryable error rather than a generic one.
    throw new Error(`Failed to update ${branch} - it may have moved concurrently, safe to retry: ${(error as Error).message}`);
  }

  return { skipped: false, commitSha: newCommit.sha as string };
}
