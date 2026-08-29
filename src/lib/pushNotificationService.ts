import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { collection, doc, setDoc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import app, { db } from './firebase';
import { saveNotificationToFirestore } from './firestoreService';
import { PushNotification } from '../types';

const FCM_TOKENS_COL = 'fcm_tokens';

// Initialize Firebase Messaging
let messagingInstance: any = null;

export function getFirebaseMessaging() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (e) {
      console.warn('Firebase Messaging not supported in this browser environment:', e);
    }
  }
  return messagingInstance;
}

/**
 * Register Service Worker for PWA Push Notifications
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('✅ PWA Firebase Messaging Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.warn('⚠️ Service Worker registration failed:', error);
    }
  }
  return null;
}

/**
 * Request Push Notification Permission & Save FCM Device Token to Firestore
 */
export async function requestPushNotificationPermission(): Promise<{
  granted: boolean;
  token?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, error: 'Push notifications are not supported by your browser.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { granted: false, error: 'Notification permission was denied by user.' };
    }

    const swReg = await registerPushServiceWorker();
    const messaging = getFirebaseMessaging();

    if (!messaging) {
      return { granted: true, error: 'Push Messaging initialized locally.' };
    }

    // Get FCM Device Token using Web Push VAPID Key or default project sender
    let token: string | undefined = undefined;
    try {
      token = await getToken(messaging, {
        serviceWorkerRegistration: swReg || undefined
      });

      if (token) {
        // Save Device Token to Firestore for background broadcasts
        const tokenRef = doc(db, FCM_TOKENS_COL, token.slice(-20));
        await setDoc(tokenRef, {
          token,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          updatedAt: serverTimestamp()
        }, { merge: true });

        console.log('✅ FCM Device Token saved to Firestore:', token);
      }
    } catch (tokenErr) {
      console.warn('FCM Token generation warning:', tokenErr);
    }

    // Listen for Foreground Messages when app is actively open
    onMessage(messaging, (payload) => {
      console.log('🔔 Foreground push message received:', payload);
      if (payload.notification) {
        new Notification(payload.notification.title || '⚽ Sunday League Alert', {
          body: payload.notification.body,
          icon: '/icon-192.png'
        });
      }
    });

    return { granted: true, token };
  } catch (err: any) {
    console.error('Error requesting push permission:', err);
    return { granted: false, error: err?.message || 'Failed to request notification permission.' };
  }
}

/**
 * Check current Notification permission status
 */
export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
}

/**
 * AUTOMATED MATCH BOT: Triggers automated push alerts for Goals, Kickoffs, Full-Time & Tournament Events
 */
export async function triggerMatchBotNotification(
  title: string,
  message: string,
  type: 'goal' | 'kickoff' | 'result' | 'tournament' | 'system' = 'goal',
  matchId?: string
): Promise<PushNotification> {
  console.log(`🤖 [MATCH BOT] Firing Auto-Notification (${type}): ${title} - ${message}`);

  const botNotification: PushNotification = {
    id: `bot-notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: `🤖 ${title}`,
    message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: type === 'goal' ? 'goal' : type === 'kickoff' || type === 'result' ? 'match' : 'system',
    matchId,
    read: false
  } as PushNotification;

  // 1. Save to Firestore notifications collection so all clients update live
  await saveNotificationToFirestore(botNotification);

  // 2. Trigger native browser/device alert if permission is granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`🤖 ${title}`, {
        body: message,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200]
      } as any);
    } catch (e) {
      console.warn('Native notification display error:', e);
    }
  }

  return botNotification;
}
