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
  // Reload onto the new version when one *replaces* the worker controlling
  // this page - whether this tab tapped "Update" or another tab did (which
  // also deletes the old cache, so this page must move on). But never when a
  // worker takes control for the first time: the first install fires
  // controllerchange too (the worker claims the open page), and reloading
  // then would restart a game the player has only just opened. Tracked per
  // change, not once at load, so a page that was first-installed and then
  // updated in the same visit still reloads.
  let controlled = !!sw.controller;
  let reloaded = false;
  sw.addEventListener("controllerchange", () => {
    const replacing = controlled;
    controlled = true;
    if (!replacing || reloaded) return;
    reloaded = true;
    reload();
  });

  sw.register(SW_URL, { scope: SW_SCOPE })
    .then((reg) => {
      const offer = (worker: ServiceWorker) => prompt.show(() => worker.postMessage("SKIP_WAITING"));
      const watch = (incoming: ServiceWorker) =>
        incoming.addEventListener("statechange", () => {
          // Only an *update* if a worker already controls the page; the very
          // first install just quietly makes the game available offline.
          if (incoming.state === "installed" && sw.controller) offer(incoming);
        });
      // Downloaded on an earlier visit and still waiting...
      if (reg.waiting && sw.controller) offer(reg.waiting);
      // ...or already downloading before this listener could be attached.
      if (reg.installing) watch(reg.installing);
      reg.addEventListener("updatefound", () => {
        if (reg.installing) watch(reg.installing);
      });
    })
    .catch((error) => console.error("Bobbin service worker registration failed:", error));
}
