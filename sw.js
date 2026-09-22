/* Service worker — cache offline + clique em notificação */
const CACHE = 'controle-v4-1-1';
const ARQUIVOS = [
  './',
  './index.html',
  './css/app.css',
  './js/dados.js',
  './js/treino.js',
  './js/fotos.js',
  './js/metabolismo.js',
  './js/off.js',
  './js/analise2.js',
  './js/diagnostico.js',
  './js/cardapio.js',
  './js/coach.js',
  './js/registro-nl.js',
  './js/agente.js',
  './js/memoria.js',
  './js/fases.js',
  './js/jejum.js',
  './js/saber.js',
  './js/assistente.js',
  './js/ia-externa.js',
  './js/ia-local.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Rede primeiro para os próprios arquivos (pega atualização),
   cache como reserva quando estiver offline. */
self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // fontes externas: cache primeiro, é conteúdo estável
  if (url.origin !== location.origin) {
    ev.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  ev.respondWith(
    fetch(req)
      .then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});

/* Trazer o app para frente quando a pessoa toca no lembrete */
self.addEventListener('notificationclick', ev => {
  ev.notification.close();
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
      for (const c of lista) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow('./index.html');
    })
  );
});
