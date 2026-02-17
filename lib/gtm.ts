
export const GTM_ID = 'GTM-5M3PTPFD';

type WindowWithDataLayer = Window & {
    dataLayer: any[];
};

declare const window: WindowWithDataLayer;

export const pageview = (url: string) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
            event: 'pageview',
            page: url,
        });
    }
};

export const sendGTMEvent = (event: string | object, data?: object) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        if (typeof event === 'string') {
            window.dataLayer.push({
                event,
                ...data,
            });
        } else {
            window.dataLayer.push(event);
        }
    }
};
