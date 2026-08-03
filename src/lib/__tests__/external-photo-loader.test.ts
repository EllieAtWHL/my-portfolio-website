import {
  loadPhotosFromExternalRepo,
  loadPhotosFromGitHub,
  validateExternalRepoConfig,
} from '../external-photo-loader';
import type { PhotoManifest } from '@/types/photo-manifest';
import type { Media } from '@/lib/data/media';

describe('loadPhotosFromExternalRepo', () => {
  it('returns the photo array for a key present in the manifest', () => {
    const manifest: PhotoManifest = { 'folder-a': ['a.jpg', 'b.jpg'] };

    expect(loadPhotosFromExternalRepo('folder-a', manifest)).toEqual(['a.jpg', 'b.jpg']);
  });

  it('returns an empty array for a key absent from the manifest', () => {
    const manifest: PhotoManifest = { 'folder-a': ['a.jpg'] };

    expect(loadPhotosFromExternalRepo('missing-folder', manifest)).toEqual([]);
  });
});

describe('loadPhotosFromGitHub', () => {
  it('delegates to the manifest lookup using photo.url as the folder key', () => {
    const manifest: PhotoManifest = { 'folder-a': ['a.jpg', 'b.jpg'] };
    const photo = { id: 1, match_id: 1, type: 'photo album', url: 'folder-a' } as unknown as Media;

    expect(loadPhotosFromGitHub(photo, manifest)).toEqual(['a.jpg', 'b.jpg']);
  });

  it('returns an empty array when photo.url has no matching manifest entry', () => {
    const manifest: PhotoManifest = { 'folder-a': ['a.jpg'] };
    const photo = { id: 1, match_id: 1, type: 'photo album', url: 'no-such-folder' } as unknown as Media;

    expect(loadPhotosFromGitHub(photo, manifest)).toEqual([]);
  });
});

describe('validateExternalRepoConfig', () => {
  const ENV_KEYS = ['EXTERNAL_REPO_OWNER', 'EXTERNAL_REPO_NAME', 'GITHUB_TOKEN', 'CDN_PROVIDER', 'CDN_BASE_URL'];
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
    Object.assign(process.env, originalEnv);
  });

  it('reports canUseApi true only when the token and both required vars are all set', () => {
    process.env.GITHUB_TOKEN = 'token';
    process.env.EXTERNAL_REPO_OWNER = 'owner';
    process.env.EXTERNAL_REPO_NAME = 'repo';

    const result = validateExternalRepoConfig();

    expect(result.hasToken).toBe(true);
    expect(result.required).toEqual({ EXTERNAL_REPO_OWNER: true, EXTERNAL_REPO_NAME: true });
    expect(result.canUseApi).toBe(true);
  });

  it('reports canUseApi false when nothing is set', () => {
    const result = validateExternalRepoConfig();

    expect(result.hasToken).toBe(false);
    expect(result.required).toEqual({ EXTERNAL_REPO_OWNER: false, EXTERNAL_REPO_NAME: false });
    expect(result.canUseApi).toBe(false);
  });

  it('reports canUseApi false when the token is missing even though both required vars are set', () => {
    process.env.EXTERNAL_REPO_OWNER = 'owner';
    process.env.EXTERNAL_REPO_NAME = 'repo';

    const result = validateExternalRepoConfig();

    expect(result.hasToken).toBe(false);
    expect(result.canUseApi).toBe(false);
  });

  it('reports canUseApi false when only EXTERNAL_REPO_OWNER is missing', () => {
    process.env.GITHUB_TOKEN = 'token';
    process.env.EXTERNAL_REPO_NAME = 'repo';

    const result = validateExternalRepoConfig();

    expect(result.required.EXTERNAL_REPO_OWNER).toBe(false);
    expect(result.canUseApi).toBe(false);
  });

  it('reports canUseApi false when only EXTERNAL_REPO_NAME is missing', () => {
    process.env.GITHUB_TOKEN = 'token';
    process.env.EXTERNAL_REPO_OWNER = 'owner';

    const result = validateExternalRepoConfig();

    expect(result.required.EXTERNAL_REPO_NAME).toBe(false);
    expect(result.canUseApi).toBe(false);
  });

  it('reports canUseApi true even when a required var is present but empty-string (falls back to false via !! coercion) - documents the !!process.env[x] coercion for an empty string', () => {
    process.env.GITHUB_TOKEN = 'token';
    process.env.EXTERNAL_REPO_OWNER = '';
    process.env.EXTERNAL_REPO_NAME = 'repo';

    const result = validateExternalRepoConfig();

    // An empty string is falsy, so !!'' is false - an empty-string env var
    // is treated the same as an unset one.
    expect(result.required.EXTERNAL_REPO_OWNER).toBe(false);
    expect(result.canUseApi).toBe(false);
  });

  it('tracks optional env vars independently of canUseApi', () => {
    process.env.CDN_PROVIDER = 'cloudflare';

    const result = validateExternalRepoConfig();

    expect(result.optional).toEqual({
      GITHUB_TOKEN: false,
      CDN_PROVIDER: true,
      CDN_BASE_URL: false,
    });
  });
});
