'use client';

import { useEffect } from 'react';
import mixpanel from 'mixpanel-browser';

export default function Mixpanel() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (token) {
      mixpanel.init(token, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: 'localStorage',
      });
    } else {
      console.warn('Mixpanel Token not found in ENV');
    }
  }, []);

  return null;
}
