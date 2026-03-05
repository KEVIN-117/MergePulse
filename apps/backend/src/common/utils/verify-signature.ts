import * as crypto from 'crypto';

export function verifySignature(signature: string, payload: string, secret: string) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
        return false;
    }
}