import { describe, expect, it, vi } from 'vitest';
import type { LocalNotificationRuntime } from './local-notification-test';
import { showLocalNotificationTest } from './local-notification-test';

function runtime(overrides: Partial<LocalNotificationRuntime> = {}): LocalNotificationRuntime {
  return {
    secureContext: true,
    supported: true,
    requestPermission: vi.fn(async () => 'granted' as NotificationPermission),
    showOnDevice: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('showLocalNotificationTest', () => {
  it('requires a secure context before requesting permission', async () => {
    const environment = runtime({ secureContext: false });

    await expect(showLocalNotificationTest('Prueba', 'Mensaje', environment)).resolves.toBe('insecure-context');
    expect(environment.requestPermission).not.toHaveBeenCalled();
    expect(environment.showOnDevice).not.toHaveBeenCalled();
  });

  it('returns unsupported when Notification or service workers are unavailable', async () => {
    const environment = runtime({ supported: false });

    await expect(showLocalNotificationTest('Prueba', 'Mensaje', environment)).resolves.toBe('unsupported');
    expect(environment.requestPermission).not.toHaveBeenCalled();
  });

  it('requests permission and shows the current preview locally when granted', async () => {
    const environment = runtime();

    await expect(showLocalNotificationTest('Oferta', 'Solo en este celular', environment)).resolves.toBe('shown');
    expect(environment.requestPermission).toHaveBeenCalledOnce();
    expect(environment.showOnDevice).toHaveBeenCalledWith('Oferta', 'Solo en este celular');
  });

  it('reports denied and pending permission without showing a notification', async () => {
    const denied = runtime({ requestPermission: vi.fn(async () => 'denied' as NotificationPermission) });
    const pending = runtime({ requestPermission: vi.fn(async () => 'default' as NotificationPermission) });

    await expect(showLocalNotificationTest('Prueba', 'Mensaje', denied)).resolves.toBe('permission-denied');
    await expect(showLocalNotificationTest('Prueba', 'Mensaje', pending)).resolves.toBe('permission-pending');
    expect(denied.showOnDevice).not.toHaveBeenCalled();
    expect(pending.showOnDevice).not.toHaveBeenCalled();
  });

  it('reports a local display failure without claiming it was shown', async () => {
    const environment = runtime({ showOnDevice: vi.fn(async () => { throw new Error('display failed'); }) });

    await expect(showLocalNotificationTest('Prueba', 'Mensaje', environment)).resolves.toBe('failed');
  });
});
