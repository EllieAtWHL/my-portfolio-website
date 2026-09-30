// Whether /microbrew lets people start a game.
//
// The game ships ticket by ticket, so it's playable everywhere except the live
// site until it's finished: local dev and every Vercel PR preview can click
// through whatever has been built so far, while production keeps "Coming soon".
// To launch, set MICROBREW_ENABLED=true in the Vercel production environment
// and redeploy: /microbrew is statically rendered, so this is evaluated once at
// build time, not per request.
//
// Read on the server (src/app/microbrew/page.tsx) and passed down as a prop -
// neither variable is exposed to the browser.
export function isMicrobrewPlayable(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.MICROBREW_ENABLED === 'true' || env.VERCEL_ENV !== 'production';
}
