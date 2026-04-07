import { analyticsPromise } from './firebase';

export async function logAnalyticsEvent(
  eventName: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const [{ logEvent }] = await Promise.all([import('firebase/analytics')]);
  const analytics = await analyticsPromise;
  if (analytics) {
    (logEvent as (instance: unknown, name: string, params?: Record<string, unknown>) => void)(
      analytics,
      eventName,
      params,
    );
  }
}
