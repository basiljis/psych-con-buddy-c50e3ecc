// Registers the production service worker (/sw.js).
// Skips registration inside iframes and on Lovable preview hosts to avoid
// caching stale builds in the editor preview.

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // Skip in iframes (Lovable preview)
  let inIframe = false;
  try { inIframe = window.self !== window.top; } catch { inIframe = true; }
  const host = window.location.hostname;
  const isPreview =
    host.includes('lovableproject.com') ||
    host.includes('lovable.app') ||
    host.includes('id-preview--');

  if (inIframe || isPreview) {
    // Make sure no stale SW survives in preview contexts
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    return;
  }

  // Pre-emptively kill the legacy /service-worker.js registration if present
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
      if (url.endsWith('/service-worker.js')) {
        r.unregister().catch(() => {});
      }
    });
  }).catch(() => {});

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      await registration.update().catch(() => {});

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[sw] new version available');
          }
        });
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SKIP_WAITING') {
          window.location.reload();
        }
      });
    } catch (error) {
      console.error('[sw] registration failed', error);
    }
  });
}
