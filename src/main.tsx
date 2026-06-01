import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// Unregister any stale service workers on Lovable preview/dev hosts —
// they cache old JS chunks and cause "dispatcher.useState is null" errors
// from two-React-copies symptoms.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const host = window.location.hostname;
  const isPreview =
    host.endsWith('.lovableproject.com') ||
    host.endsWith('.lovable.app') ||
    host.endsWith('.lovableproject-dev.com');
  if (isPreview) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);

