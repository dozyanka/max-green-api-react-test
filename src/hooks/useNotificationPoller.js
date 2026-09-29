import { useEffect } from 'react';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useNotificationPoller({ api, enabled, onNotification, onStateChange, onError }) {
  useEffect(() => {
    if (!enabled || !api) return undefined;

    let cancelled = false;
    const controller = new AbortController();

    async function loop() {
      onStateChange?.('connecting');

      while (!cancelled) {
        try {
          const notification = await api.receiveNotification(5, controller.signal);
          if (cancelled) return;

          onStateChange?.('online');

          if (notification?.receiptId != null) {
            await onNotification?.(notification.body);
            await api.deleteNotification(notification.receiptId, controller.signal);
          }
        } catch (error) {
          if (cancelled || error?.name === 'AbortError') return;
          onStateChange?.('retrying');
          onError?.(error);
          await wait(1600);
        }
      }
    }

    loop();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [api, enabled, onError, onNotification, onStateChange]);
}
