import { useState, useEffect } from 'react';

declare global {
  interface Window {
    mappls: any;
  }
}

let isScriptInjected = false;
let sdkLoadPromise: Promise<void> | null = null;

export function useMapplsSdk() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapKey = process.env.NEXT_PUBLIC_MAPPLS_WEB_KEY;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.mappls) {
      setIsLoaded(true);
      return;
    }

    if (!mapKey || mapKey.trim().length === 0) {
      setError('Mappls Web Map key is missing from customer-web build.');
      return;
    }

    if (!sdkLoadPromise) {
      sdkLoadPromise = new Promise((resolve, reject) => {
        // Check if a script already exists in the DOM
        const existingScript = document.querySelector('script[src*="sdk.mappls.com/map/sdk/web"]');
        
        if (existingScript) {
          if (window.mappls) {
            resolve();
          } else {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', (e) => reject(e));
          }
          return;
        }

        // Create the script element
        const script = document.createElement('script');
        script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${mapKey}`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (window.mappls) {
            resolve();
          } else {
            reject(new Error('Script loaded but window.mappls is undefined.'));
          }
        };

        script.onerror = (e) => {
          reject(new Error('Script failed to load due to a network or CORS error.'));
        };

        document.head.appendChild(script);
      });
    }

    sdkLoadPromise
      .then(() => {
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        setIsLoaded(false);
        setError(err.message || 'Mappls SDK failed to load.');
      });
  }, [mapKey]);

  return { isLoaded, error, mapKey };
}
