const cleanupPreviewServiceWorkers = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const host = window.location.hostname;
  const isPreview =
    host.endsWith('.lovableproject.com') ||
    host.endsWith('.lovable.app') ||
    host.endsWith('.lovableproject-dev.com');

  if (!isPreview) return;

  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));

  if (window.caches) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
};

const bootstrap = async () => {
  await cleanupPreviewServiceWorkers();

  const [{ createRoot }, React, { default: App }] = await Promise.all([
    import('./index.css'),
    import('react-dom/client'),
    import('react'),
    import('./App.tsx'),
    import('./i18n'),
  ]).then(([, reactDom, react, app]) => [reactDom, react, app] as const);

  createRoot(document.getElementById("root")!).render(React.createElement(App));
};

void bootstrap();

