'use client';
import React, { useEffect, useRef } from 'react';
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

// A short WAV beep encoded as base64 (no external file needed)
const BEEP_WAV = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA' +
  'EAAQAQDgAAEA4AAAIAAgAZGF0YTtvT18A' +
  'AAAAAAAA/////wAAAAAAAAD/////AAAAAA' +
  'AAAP////8AAAAAAAAAAP////8AAAAAAAAAA' +
  'P////8AAAAAAAAAAP////8AAAAAAAAAA';

// Proper short beep as WAV (440Hz sine wave, 0.3 seconds)
function generateBeepUrl(): string {
  const sampleRate = 22050;
  const duration = 0.35;
  const freq = 880;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    // Sine wave with fade-out envelope
    const envelope = 1 - (i / numSamples);
    const sample = Math.sin(2 * Math.PI * freq * i / sampleRate) * envelope * 0.7;
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export default function FcmInitializer() {
  const token = useHotelAuthStore((state: any) => state.accessToken);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-create and unlock the audio element on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unlockAudio = () => {
      if (!audioRef.current) {
        const beepUrl = generateBeepUrl();
        const audio = new Audio(beepUrl);
        audio.volume = 1.0;
        audioRef.current = audio;
        // Play silently to unlock autoplay
        audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const stopRinging = () => {
    if (ringIntervalRef.current) { clearInterval(ringIntervalRef.current); ringIntervalRef.current = null; }
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    document.removeEventListener('click', stopRinging);
    document.removeEventListener('touchstart', stopRinging);
    document.removeEventListener('keydown', stopRinging);
  };

  const startRinging = () => {
    const playBeep = () => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    };

    playBeep();
    ringIntervalRef.current = setInterval(playBeep, 3000);

    // Stop after 40 seconds
    ringTimeoutRef.current = setTimeout(stopRinging, 40000);

    // Stop on any interaction
    document.addEventListener('click', stopRinging);
    document.addEventListener('touchstart', stopRinging);
    document.addEventListener('keydown', stopRinging);
  };

  useEffect(() => {
    if (!token) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
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
            const title = payload.notification?.title || 'New Order!';
            const options = {
              body: payload.notification?.body,
              icon: '/icon.png',
              data: payload.data,
            };
            new Notification(title, options);
            startRinging();
          });
        }
      } catch (err: any) {
        console.error('Failed to setup FCM', err);
      }
    };

    requestPermission();

    return () => { stopRinging(); };
  }, [token]);

  return null;
}
