'use client';

import { useState } from 'react';

// WEB-148 spike: throwaway test page to drive the photo-upload-spike API route
// from a phone. Deliberately unstyled/minimal - explicitly out of scope for
// this spike to build real admin UI. Delete this page (and the API route)
// once the spike's findings are written up, unless the follow-up feature
// issue decides to build on it directly.

interface SpikeResult {
  success: boolean;
  path: string;
  githubHtmlUrl: string;
  cdnUrl: string;
  cdnNote: string;
  metrics: {
    originalSizeBytes: number;
    optimisedSizeBytes: number;
    underTargetSize: boolean;
    resizeDurationMs: number;
    commitDurationMs: number;
    totalDurationMs: number;
  };
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function PhotoUploadSpikePage() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<SpikeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setResult(null);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/admin/photo-upload-spike', {
        method: 'POST',
        body: formData,
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || `Request failed with ${response.status}`);
      }

      setResult(body);
      setStatus('done');
    } catch (error) {
      setErrorMessage((error as Error).message);
      setStatus('error');
    }
  }

  return (
    <main style={{ padding: '1.5rem', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>WEB-148: Photo upload spike</h1>
      <p style={{ marginBottom: '1rem' }}>
        Take or pick one photo. It will be resized/compressed to WebP server-side and committed
        into the <code>_spike-test/</code> folder of <code>spurs-women-photo-gallery</code>.
      </p>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={status === 'uploading'}
      />

      {status === 'uploading' && <p style={{ marginTop: '1rem' }}>Uploading...</p>}

      {status === 'error' && (
        <p style={{ marginTop: '1rem', color: 'crimson' }}>Failed: {errorMessage}</p>
      )}

      {status === 'done' && result && (
        <div style={{ marginTop: '1rem' }}>
          <p>Committed to: <code>{result.path}</code></p>
          <p>
            {formatBytes(result.metrics.originalSizeBytes)} -&gt; {formatBytes(result.metrics.optimisedSizeBytes)}{' '}
            ({result.metrics.underTargetSize ? 'under' : 'over'} 500KB target)
          </p>
          <p>Resize: {result.metrics.resizeDurationMs}ms, commit: {result.metrics.commitDurationMs}ms, total: {result.metrics.totalDurationMs}ms</p>
          <p><a href={result.githubHtmlUrl} target="_blank" rel="noreferrer">View commit on GitHub</a></p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>{result.cdnNote}</p>
          <p><a href={result.cdnUrl} target="_blank" rel="noreferrer">{result.cdnUrl}</a></p>
        </div>
      )}
    </main>
  );
}
