import './index.css';

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

const importWithRetry = async <T,>(importFn: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await importFn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, 450));
    return importWithRetry(importFn, retries - 1);
  }
};

const showBootstrapError = () => {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:hsl(210,40%,98%);color:hsl(210,100%,15%);font-family:system-ui,-apple-system,sans-serif;text-align:center">
      <div style="max-width:440px">
        <div style="font-size:12px;letter-spacing:.25em;text-transform:uppercase;margin-bottom:16px">universum.</div>
        <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px">Не удалось загрузить приложение</h1>
        <p style="font-size:15px;line-height:1.5;margin:0 0 20px;opacity:.75">Обновите страницу. Если ошибка повторится, очистите кэш браузера.</p>
        <button onclick="window.location.reload()" style="height:44px;padding:0 18px;border-radius:8px;border:0;background:hsl(210,100%,20%);color:white;font-weight:600;cursor:pointer">Обновить страницу</button>
      </div>
    </div>
  `;
};

const bootstrap = async () => {
  await cleanupPreviewServiceWorkers();

  const [reactDom, react, app] = await Promise.all([
    importWithRetry(() => import('react-dom/client')),
    importWithRetry(() => import('react')),
    importWithRetry(() => import('./App.tsx')),
    importWithRetry(() => import('./i18n')),
  ]).then(([rd, r, a]) => [rd, r, a] as const);

  const { createRoot } = reactDom;
  const React = react;
  const { default: App } = app;

  createRoot(document.getElementById("root")!).render(React.createElement(App));
};

void bootstrap().catch((error) => {
  console.error('[bootstrap] Failed to start application', error);
  showBootstrapError();
});
