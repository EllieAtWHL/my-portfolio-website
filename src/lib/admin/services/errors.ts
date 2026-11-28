/**
 * An error a service raises on purpose, carrying the HTTP status the admin
 * route should answer with. Anything else a service throws is unexpected and
 * becomes a 500.
 *
 * 400 - the input was invalid (zod schema, a match score rule, a database
 *       constraint); nothing was written.
 * 404 - the row being updated or deleted doesn't exist.
 */
export class AdminServiceError extends Error {
  constructor(message: string, readonly status: 400 | 404 = 400) {
    super(message);
    this.name = 'AdminServiceError';
  }
}

interface PostgrestLikeError {
  message: string;
  code?: string;
}

/**
 * Maps a Supabase/PostgREST error to an AdminServiceError when it's the
 * caller's fault (Postgres class 22 "data exception" or 23 "integrity
 * constraint violation", e.g. a duplicate or a missing foreign key), or a
 * plain Error (so a 500) when it isn't.
 */
export function fromDatabaseError(error: PostgrestLikeError): Error {
  const code = error.code ?? '';
  if (code.startsWith('22') || code.startsWith('23')) {
    return new AdminServiceError(error.message, 400);
  }
  return new Error(error.message);
}
