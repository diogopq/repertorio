// Service worker mínimo — existe principalmente para satisfazer o critério
// de instalabilidade do Android/Chrome (PWA precisa de um SW registrado
// com um handler de "fetch"). Também deixa o "casco" do app (HTML/ícones)
// disponível offline; buscas no YouTube e sincronização com o Firestore
// continuam exigindo conexão com a internet.

const CACHE_NAME = 'setlist-shell-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Nunca interceptar chamadas de API/Firebase/YouTube — sempre precisam ir à rede.
  const url = new URL(req.url);
  const isAppShellRequest =
    url.origin === self.location.origin &&
    (req.mode === 'navigate' || APP_SHELL.some((p) => url.pathname.endsWith(p.replace('./', '/'))));

  if (!isAppShellRequest) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
