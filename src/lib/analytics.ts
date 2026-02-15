import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Page view tracking hook
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.PROD) {
      console.log('Page view:', location.pathname);
    }
  }, [location]);
}

// Custom event tracking
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (import.meta.env.PROD) {
    console.log('Event:', eventName, properties);
  }
}

// Web Vitals monitoring
export function reportWebVitals() {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(console.log);
      onFCP(console.log);
      onLCP(console.log);
      onTTFB(console.log);
      onINP(console.log);
    }).catch(() => {
      // web-vitals not available
    });
  }
}
