'use client';
import React, { useEffect, useRef, useState } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showTestBtn, setShowTestBtn] = useState(false);

  const stopRinging = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const startRinging = () => {
    stopRinging(); // Stop any previous ringing
    const audio = audioRef.current;
    if (!audio) {
      alert('DEBUG: audioRef is null - audio element not mounted yet');
      return;
    }

    const playOnce = () => {
      audio.currentTime = 0;
      audio.play().catch((e) => console.error('play() error:', e.name, e.message));
    };

    playOnce();
    ringIntervalRef.current = setInterval(playOnce, 3000);

    // Auto-stop after 40 seconds
    setTimeout(() => stopRinging(), 40000);

    // Stop on user interaction
    const stop = () => { stopRinging(); document.removeEventListener('click', stop); };
    document.addEventListener('click', stop);
  };

  useEffect(() => {
    if (!token) return;

    // Mount the audio element
    const audio = new Audio('/beep.wav');
    audio.preload = 'auto';
    audioRef.current = audio;

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
          setShowTestBtn(true);
        }

        onMessage(messaging, (payload) => {
          alert('DEBUG: onMessage fired! Order received. Attempting to ring...');
          new Notification(payload.notification?.title || 'New Order!', {
            body: payload.notification?.body,
            icon: '/icon.png',
          });
          startRinging();
        });
      } catch (err: any) {
        console.error('FCM setup failed:', err);
      }
    };

    requestPermission();

    return () => { stopRinging(); };
  }, [token]);

  if (!showTestBtn) return null;

  return (
    <button
      onClick={() => {
        // This is a direct user gesture - audio will definitely play
        startRinging();
        alert('Test ring started! You should hear a beep every 3 seconds. Click anywhere to stop.');
      }}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        background: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 18px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      🔔 Test Sound
    </button>
  );
}
