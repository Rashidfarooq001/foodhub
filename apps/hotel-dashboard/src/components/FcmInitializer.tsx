'use client';
import React, { useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useHotelAuthStore } from '../stores/use-hotel-auth-store';
import { hotelFetch } from '../utils/hotel-fetch';

const firebaseConfig = {
  apiKey: 'AIzaSyBN5-exOsydIQvUJP50NR9crClm4qw67n8',
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
        if (permission !== 'granted') return;

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
          // Show browser notification
          const title = payload.notification?.title || 'New Order!';
          new Notification(title, {
            body: payload.notification?.body,
            icon: '/icon.png',
            data: payload.data,
          });

          // Play the beep every 3 seconds for 40 seconds
          let stopped = false;
          let count = 0;

          const playBeep = () => {
            if (stopped) return;
            const audio = new Audio('/beep.wav');
            audio.volume = 1.0;
            audio.play().catch((e) => console.error('Audio play failed:', e));
          };

          playBeep();
          const intervalId = setInterval(() => {
            count++;
            if (count >= 13) { // 13 * 3s = 39s ~ 40s
              stopped = true;
              clearInterval(intervalId);
              return;
            }
            playBeep();
          }, 3000);

          // Stop on any user click/key
          const stopRinging = () => {
            stopped = true;
            clearInterval(intervalId);
            document.removeEventListener('click', stopRinging);
            document.removeEventListener('keydown', stopRinging);
            document.removeEventListener('touchstart', stopRinging);
          };
          document.addEventListener('click', stopRinging);
          document.addEventListener('keydown', stopRinging);
          document.addEventListener('touchstart', stopRinging);
        });
      } catch (err: any) {
        console.error('FCM setup failed:', err);
      }
    };

    requestPermission();
  }, [token]);

  return null;
}
