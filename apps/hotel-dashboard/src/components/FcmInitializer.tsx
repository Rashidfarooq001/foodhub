'use client';
import React, { useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useHotelAuthStore } from '../stores/use-hotel-auth-store';
import { hotelFetch } from '../utils/hotel-fetch';

const firebaseConfig = {
  apiKey: 'AIzaSyBT5-exOsydIQvUJP50NR9crClm4qw67n8',
  authDomain: 'foodtop-98529.firebaseapp.com',
  projectId: 'foodtop-98529',
  storageBucket: 'foodtop-98529.firebasestorage.app',
  messagingSenderId: '38401266283',
  appId: '1:38401266283:web:f12a867e3ac4cb21fd572e'
};

export default function FcmInitializer() {
  const token = useHotelAuthStore((state: any) => state.accessToken);

  useEffect(() => {
    if (!token) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Avoid "Firebase: Firebase App named '[DEFAULT]' already exists" error
          const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
          const messaging = getMessaging(app);
          const fcmToken = await getToken(messaging, {
            vapidKey: 'BJwPPAyGyiSD_npT6ZVPyca9XoNX5_G-zqqrNJr0CyaHnFEzx4q__Jt_jR_hSC6tiAI-20pDpx8m6irapQ74kU0'
          });

          if (fcmToken) {
            await hotelFetch('/notifications/fcm-token', {
              method: 'POST',
              body: JSON.stringify({ token: fcmToken })
            });
          }

          onMessage(messaging, (payload) => {
            const title = payload.notification?.title || 'Notification';
            const options = {
              body: payload.notification?.body,
              icon: '/icon.png',
              data: payload.data,
            };
            new Notification(title, options);
          });
        }
      } catch (err) {
        console.error('Failed to request FCM token', err);
      }
    };

    requestPermission();
  }, [token]);

  return null;
}
