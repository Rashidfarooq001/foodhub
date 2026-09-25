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

// Global audio context to bypass autoplay restrictions
let globalAudioCtx: any = null;
if (typeof window !== 'undefined') {
  const initAudio = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext && !globalAudioCtx) {
      globalAudioCtx = new AudioContext();
    } else if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
  };
  window.addEventListener('click', initAudio);
  window.addEventListener('touchstart', initAudio);
}

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
            alert('FCM Token successfully registered! You will now receive notifications.');
          } else {
            alert('FCM token was null');
          }

          onMessage(messaging, (payload) => {
            const title = payload.notification?.title || 'Notification';
            const options = {
              body: payload.notification?.body,
              icon: '/icon.png',
              data: payload.data,
            };
            new Notification(title, options);

            // --- Continuous Ringing ---
            if (globalAudioCtx) {
              try {
                if (globalAudioCtx.state === 'suspended') {
                  globalAudioCtx.resume();
                }
                
                let isPlaying = true;
                
                const playChime = () => {
                  if (!isPlaying) return;
                  const now = globalAudioCtx.currentTime;
                  
                  // High note (Ding)
                  const osc1 = globalAudioCtx.createOscillator();
                  const gain1 = globalAudioCtx.createGain();
                  osc1.type = 'sine';
                  osc1.frequency.setValueAtTime(880, now); // A5
                  gain1.gain.setValueAtTime(0, now);
                  gain1.gain.linearRampToValueAtTime(0.5, now + 0.05);
                  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                  osc1.connect(gain1);
                  gain1.connect(globalAudioCtx.destination);
                  osc1.start(now);
                  osc1.stop(now + 0.5);
                  
                  // Low note (Dong)
                  const osc2 = globalAudioCtx.createOscillator();
                  const gain2 = globalAudioCtx.createGain();
                  osc2.type = 'sine';
                  osc2.frequency.setValueAtTime(659.25, now + 0.3); // E5
                  gain2.gain.setValueAtTime(0, now + 0.3);
                  gain2.gain.linearRampToValueAtTime(0.5, now + 0.35);
                  gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
                  osc2.connect(gain2);
                  gain2.connect(globalAudioCtx.destination);
                  osc2.start(now + 0.3);
                  osc2.stop(now + 1.0);
                };

                const intervalId = setInterval(playChime, 3000);
                playChime(); // Play first chime immediately

                const stopRinging = () => {
                  if (!isPlaying) return;
                  isPlaying = false;
                  clearInterval(intervalId);
                  document.removeEventListener('click', stopRinging);
                  document.removeEventListener('keydown', stopRinging);
                  document.removeEventListener('touchstart', stopRinging);
                };

                // Stop ringing on user interaction
                document.addEventListener('click', stopRinging);
                document.addEventListener('keydown', stopRinging);
                document.addEventListener('touchstart', stopRinging);

                // Stop automatically after 40 seconds
                setTimeout(stopRinging, 40000);
              } catch (audioErr) {
                console.error("Audio chime failed:", audioErr);
              }
            }
          });
        } else {
          alert('Notification permission was ' + permission);
        }
      } catch (err: any) {
        console.error('Failed to request FCM token', err);
        alert('FCM Error: ' + err?.message);
      }
    };

    requestPermission();
  }, [token]);

  return null;
}
