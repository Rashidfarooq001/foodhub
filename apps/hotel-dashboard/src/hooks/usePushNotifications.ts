import { useState, useEffect } from 'react';

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register service worker
      navigator.serviceWorker.register('/sw.js').catch(console.error);

      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const subscribeToPush = async (backendSubscribeUrl: string, token: string) => {
    if (!isSupported) return false;

    // Ask for permission if not already granted
    if (Notification.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      let sub = await registration.pushManager.getSubscription();

      // Create a new subscription if one does not exist in the browser
      if (!sub) {
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          console.error('[Push] VAPID public key not found in env');
          return false;
        }
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });
      }

      setSubscription(sub);

      // ALWAYS send to backend — this ensures re-registration after bugs are fixed
      const res = await fetch(backendSubscribeUrl, {
        method: 'POST',
        body: JSON.stringify(sub),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
      });

      if (!res.ok) {
        console.error('[Push] Backend subscription failed:', res.status, res.statusText);
        return false;
      }

      console.log('[Push] Subscription saved to backend successfully.');
      return true;
    } catch (error) {
      console.error('[Push] Failed to subscribe:', error);
      return false;
    }
  };

  return { isSupported, permission, subscription, requestPermission, subscribeToPush };
}
