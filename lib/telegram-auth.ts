import crypto from 'crypto'

export function verifyTelegramWebAppData(telegramInitData: string): boolean {
    if (!process.env.TELEGRAM_BOT_TOKEN) return true;

    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');

    if (!hash) return false;

    urlParams.delete('hash');

    const v = Array.from(urlParams.entries());
    v.sort((a, b) => a[0].localeCompare(b[0]));

    const dataCheckString = v.map(([key, val]) => `${key}=${val}`).join('\n');

    const secret = crypto
        .createHmac('sha256', 'WebAppData')
        .update(process.env.TELEGRAM_BOT_TOKEN)
        .digest();

    const calculatedHash = crypto
        .createHmac('sha256', secret)
        .update(dataCheckString)
        .digest('hex');

    return calculatedHash === hash;
}
