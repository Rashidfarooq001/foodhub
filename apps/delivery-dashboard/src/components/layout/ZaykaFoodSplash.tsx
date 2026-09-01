'use client';

import React, { useEffect, useState } from 'react';

interface ZaykaFoodSplashProps {
  onComplete: () => void;
}

export const ZaykaFoodSplash: React.FC<ZaykaFoodSplashProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onComplete(), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #ea580c 100%)',
        opacity: phase === 'exit' ? 0 : 1,
        transition:
          phase === 'exit'
            ? 'opacity 0.5s ease-out'
            : phase === 'enter'
              ? 'opacity 0.4s ease-in'
              : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          transform:
            phase === 'hold' || phase === 'exit'
              ? 'scale(1) translateY(0)'
              : 'scale(0.85) translateY(20px)',
          opacity: phase === 'hold' || phase === 'exit' ? 1 : 0,
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
        }}
      >
        <img
          src="/zaykafood-logo.png"
          alt="ZaykaFood"
          style={{
            height: 100,
            width: 'auto',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.2em',
              fontFamily: 'sans-serif',
            }}
          >
            DELIVERY PARTNER PORTAL
          </p>
          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.25em',
              marginTop: 4,
              fontFamily: 'sans-serif',
            }}
          >
            ORDER • DELIVER • ENJOY
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`@keyframes splashDot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
};
