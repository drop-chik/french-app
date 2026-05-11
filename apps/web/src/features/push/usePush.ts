import { useCallback, useEffect, useState } from 'react';
import { pushApi } from './api';

type Permission = 'default' | 'granted' | 'denied' | 'unsupported';

function getPermission(): Permission {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  if (!('PushManager' in window)) return 'unsupported';
  return Notification.permission as Permission;
}

/**
 * VAPID public key arrives as a URL-safe base64 string. PushManager.subscribe
 * needs it as a Uint8Array.
 */
function urlBase64ToUint8(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Push notifications hook.
 *
 * - reports the current Notification.permission
 * - exposes enable() / disable() that handle the whole flow:
 *     request permission → wait for service worker → subscribe → POST to API
 * - exposes test() that asks the backend to send a self-test push
 *
 * Safe to call on browsers without Push API support — all actions become no-ops.
 */
export function usePush() {
  const [permission, setPermission] = useState<Permission>(getPermission);
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  // Check existing subscription on mount
  useEffect(() => {
    if (permission !== 'granted') return;
    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setSubscribed(!!sub);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [permission]);

  const enable = useCallback(async (): Promise<boolean> => {
    if (permission === 'unsupported') return false;
    setBusy(true);
    try {
      // 1. Permission
      if (permission !== 'granted') {
        const result = await Notification.requestPermission();
        setPermission(result as Permission);
        if (result !== 'granted') return false;
      }

      // 2. Wait for the SW to be ready (PWA registers it via vite-plugin-pwa)
      const reg = await navigator.serviceWorker.ready;

      // 3. Use existing subscription if there is one, otherwise create
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { publicKey } = await pushApi.publicKey();
        if (!publicKey) {
          console.warn('[push] backend has no VAPID public key configured');
          return false;
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          // .buffer cast — PushManager.subscribe wants ArrayBuffer, not Uint8Array<ArrayBufferLike>
          applicationServerKey: urlBase64ToUint8(publicKey).buffer as ArrayBuffer,
        });
      }

      // 4. Submit to backend
      const subJson = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        return false;
      }
      await pushApi.subscribe({
        endpoint: subJson.endpoint,
        keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
      });
      setSubscribed(true);
      return true;
    } catch (err) {
      console.error('[push] enable failed:', err);
      return false;
    } finally {
      setBusy(false);
    }
  }, [permission]);

  const disable = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint).catch(() => { /* ok if 404 */ });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, []);

  const test = useCallback(async () => {
    return await pushApi.test();
  }, []);

  return { permission, subscribed, busy, enable, disable, test };
}
