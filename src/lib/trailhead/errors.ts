// Every way a Trailhead lookup can fail, as one error class with a code, so the
// API route can map each to its own status and the page to its own message
// (FR-6). Messages never include the username (see "Privacy" in the plan doc):
// they end up in server logs.
export type TrailheadErrorCode =
  | 'NOT_FOUND'
  | 'PRIVATE_PROFILE'
  | 'RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_CHANGED';

export class TrailheadError extends Error {
  constructor(public readonly code: TrailheadErrorCode, message: string) {
    super(message);
    this.name = 'TrailheadError';
  }
}

export function isTrailheadError(error: unknown): error is TrailheadError {
  return error instanceof TrailheadError;
}
