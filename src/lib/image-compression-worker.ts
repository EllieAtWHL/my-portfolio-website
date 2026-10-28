// Kept in its own module (rather than inline in image-compression.ts) so
// tests can mock worker creation: `import.meta.url` is resolved by the
// Next.js bundler, not something Jest's CommonJS transform can run.
export function createCompressionWorker(): Worker {
  return new Worker(new URL('./image-compression.worker.ts', import.meta.url));
}
