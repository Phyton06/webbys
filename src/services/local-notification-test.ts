export interface LocalNotificationRuntime {
  secureContext: boolean;
  supported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  showOnDevice: (title: string, body: string) => Promise<void>;
}

export type LocalNotificationTestResult =
  | 'shown'
  | 'permission-denied'
  | 'permission-pending'
  | 'unsupported'
  | 'insecure-context'
  | 'failed';

export async function showLocalNotificationTest(
  title: string,
  body: string,
  runtime: LocalNotificationRuntime,
): Promise<LocalNotificationTestResult> {
  if (!runtime.secureContext) return 'insecure-context';
  if (!runtime.supported) return 'unsupported';
  if (!title.trim() || !body.trim()) return 'failed';

  try {
    const permission = await runtime.requestPermission();
    if (permission === 'denied') return 'permission-denied';
    if (permission !== 'granted') return 'permission-pending';
    await runtime.showOnDevice(title.trim(), body.trim());
    return 'shown';
  } catch {
    return 'failed';
  }
}
