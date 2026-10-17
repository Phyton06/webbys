import { describe, expect, it, vi } from 'vitest';
import workerSource from '../../public/notification-test-sw.js?raw';

function loadWorker(showNotification = vi.fn(async () => undefined)) {
  const listeners = new Map<string, (event: any) => void>();
  const self = {
    registration: { showNotification },
    addEventListener: (type: string, listener: (event: any) => void) => listeners.set(type, listener),
  };
  new Function('self', workerSource)(self);
  return { listeners, showNotification };
}

describe('notification-test service worker', () => {
  it('handles only the explicit local-test message and displays its title/body', async () => {
    const { listeners, showNotification } = loadWorker();
    const postMessage = vi.fn();
    const waitUntil = vi.fn();
    const handler = listeners.get('message');
    expect(handler).toBeTypeOf('function');
    expect([...listeners.keys()]).toEqual(['message']);

    handler?.({
      data: { type: 'WEBBYS_LOCAL_NOTIFICATION_TEST', title: 'Preview', body: 'Local only' },
      ports: [{ postMessage }],
      waitUntil,
    });
    await waitUntil.mock.calls[0]?.[0];

    expect(showNotification).toHaveBeenCalledWith('Preview', expect.objectContaining({ body: 'Local only' }));
    expect(postMessage).toHaveBeenCalledWith({ ok: true });
  });

  it('ignores unrelated messages and rejects malformed local-test messages', () => {
    const { listeners, showNotification } = loadWorker();
    const handler = listeners.get('message');
    const waitUntil = vi.fn();

    handler?.({ data: { type: 'OTHER' }, ports: [], waitUntil });
    handler?.({ data: { type: 'WEBBYS_LOCAL_NOTIFICATION_TEST', title: '', body: '' }, ports: [{ postMessage: vi.fn() }], waitUntil });

    expect(showNotification).not.toHaveBeenCalled();
    expect([...listeners.keys()]).toEqual(['message']);
  });
});
