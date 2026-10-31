// Whether the Trick or Trailhead checker is switched on.
//
// The Salesforce Program Agreement prohibits automated retrieval from Trailhead
// without written consent, so the checker is built but kept off the live site
// until Ellie has that permission or decides to accept the risk (WEB-234). It
// runs in local dev and every Vercel PR preview; production 404s. To launch,
// set TRICK_OR_TRAILHEAD_ENABLED=true in the Vercel production environment and
// redeploy.
//
// Same pattern as src/lib/microbrew/availability.ts. Read on the server only -
// neither variable is exposed to the browser.
export function isTrickOrTrailheadEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.TRICK_OR_TRAILHEAD_ENABLED === 'true' || env.VERCEL_ENV !== 'production';
}
