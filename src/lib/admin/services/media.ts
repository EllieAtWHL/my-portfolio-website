import { z } from 'zod';
import { invalidateMediaCache } from '@/lib/data/cache-invalidation';
import { createCrudService, type Row } from './crud';
import { AdminServiceError } from './errors';
import { count, optionalText, requiredText, uuid } from './schema-helpers';

export const MEDIA_TYPES = ['article', 'social media', 'photo', 'photo album', 'video-external'] as const;

export const mediaFields = z.object({
  match_id: uuid,
  type: z.enum(MEDIA_TYPES, { error: `must be one of ${MEDIA_TYPES.join(', ')}` }),
  title: optionalText(300).optional(),
  // Not z.url(): a "photo album" url is a gallery folder key
  // (e.g. "2023-24/20231008 WSL Spurs v ..."), not a link.
  url: requiredText(2000),
  caption: optionalText(2000).optional(),
  sort_order: count(10_000).optional(),
});

function checkMedia(row: Row): string[] {
  if (row.type !== 'photo album' && typeof row.url === 'string' && !/^https?:\/\//.test(row.url)) {
    throw new AdminServiceError('url: must be an http(s) link.');
  }
  return [];
}

const mediaService = createCrudService({
  table: 'media',
  label: 'Media',
  idSchema: uuid,
  fields: mediaFields,
  check: checkMedia,
  invalidate: invalidateMediaCache,
});

export const createMedia = mediaService.create;
export const updateMedia = mediaService.update;
export const deleteMedia = mediaService.remove;
