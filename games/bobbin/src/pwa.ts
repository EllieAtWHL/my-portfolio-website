// Registers Bobbin's offline service worker (production builds only - a
// dev-registered worker would cache stale code under the Vite dev server,
// same reasoning as the main site's ServiceWorkerRegistration) and offers a
// small "Update ready" prompt when a newer version has downloaded.

export const SW_URL = "/bobbin/sw.js";
export const SW_SCOPE = "/bobbin";

export interface UpdatePrompt {
  show: (apply: () => void) => void;
}

export function registerServiceWorker(
  prompt: UpdatePrompt,
  sw: ServiceWorkerContainer | undefined = navigator.serviceWorker,
  reload: () => void = () => location.reload(),
): void {
  if (!sw) return;
  // Reload onto the new version once it takes over - but only after the
  // player tapped "Update". The very first install also fires
  // controllerchange (the worker claims the open page), and reloading then
  // would restart a game the player has only just opened.
  let updating = false;
  let reloaded = false;
  sw.addEventListener("controllerchange", () => {
    if (!updating || reloaded) return;
    reloaded = true;
    reload();
  });

  sw.register(SW_URL, { scope: SW_SCOPE })
    .then((reg) => {
      const offer = (worker: ServiceWorker) =>
        prompt.show(() => {
          updating = true;
          worker.postMessage("SKIP_WAITING");
        });
      // An update downloaded on an earlier visit and is still waiting.
      if (reg.waiting && sw.controller) offer(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const incoming = reg.installing;
        incoming?.addEventListener("statechange", () => {
          // Only an *update* if a worker already controls the page; the very
          // first install just quietly makes the game available offline.
          if (incoming.state === "installed" && sw.controller) offer(incoming);
        });
      });
    })
    .catch((error) => console.error("Bobbin service worker registration failed:", error));
}
