export interface RetryOptions {
  /** Total number of attempts, including the first. Defaults to 3. */
  attempts?: number;
  /** Base delay in ms before the first retry; doubles each subsequent retry. Defaults to 300. */
  baseDelayMs?: number;
}

/**
 * Retries a single outbound request with exponential backoff. Scoped to
 * transient network failures on external fetches (YouTube/RSS/Acast) - not a
 * general-purpose retry system, and deliberately bounded (no unbounded
 * retry loops). Does not touch inbound rate limiting (src/lib/rate-limit.ts)
 * - that guards requests coming into this app, this guards requests this
 * app makes outward.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 300 }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const delayMs = baseDelayMs * 2 ** (attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
