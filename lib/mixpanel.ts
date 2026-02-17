import mixpanel from 'mixpanel-browser';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    try {
        if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
            mixpanel.track(eventName, properties);
        }
    } catch (e) {
        console.warn('Mixpanel track error', e);
    }
};

export const identifyUser = (id: string, properties?: Record<string, any>) => {
    try {
        if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
            mixpanel.identify(id);
            if (properties) {
                mixpanel.people.set(properties);
            }
        }
    } catch (e) {
        console.warn('Mixpanel identify error', e);
    }
}
