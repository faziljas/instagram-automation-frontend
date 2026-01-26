import { useEffect, useState } from 'react';

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

interface UseFacebookSDKReturn {
  isLoaded: boolean;
  isReady: boolean;
  error: string | null;
  FB: any;
}

export function useFacebookSDK(): UseFacebookSDKReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [FB, setFB] = useState<any>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.FB) {
      setIsLoaded(true);
      setIsReady(true);
      setFB(window.FB);
      return;
    }

    // Initialize fbAsyncInit before loading the SDK
    window.fbAsyncInit = function() {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      
      if (!appId) {
        setError('Facebook App ID not configured');
        return;
      }

      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });

      console.log('✅ Facebook SDK initialized');
      setIsReady(true);
      setFB(window.FB);
    };

    // Load the Facebook SDK asynchronously
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      setIsLoaded(true);
      console.log('✅ Facebook SDK script loaded');
    };
    
    script.onerror = () => {
      setError('Failed to load Facebook SDK');
      console.error('❌ Failed to load Facebook SDK');
    };

    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return { isLoaded, isReady, error, FB };
}
