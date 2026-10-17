// Local device notification test worker. No push or fetch handlers.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'WEBBYS_LOCAL_NOTIFICATION_TEST') return;

  const port = event.ports?.[0];
  const title = typeof event.data.title === 'string' ? event.data.title.trim() : '';
  const body = typeof event.data.body === 'string' ? event.data.body.trim() : '';
  if (!port) return;
  if (!title || !body) {
    port.postMessage({ ok: false, reason: 'invalid-message' });
    return;
  }

  const display = Promise.resolve()
    .then(() => self.registration.showNotification(title, { body, tag: 'webbys-local-notification-test' }))
    .then(
      () => port.postMessage({ ok: true }),
      () => port.postMessage({ ok: false, reason: 'display-failed' }),
    );
  event.waitUntil(display);
});
