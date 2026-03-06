import * as crypto from 'crypto';

export function verifySignature(signature: string, payload: string, secret: string) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedSignatureBuffer.length) {
        return false;
    }

    try {
        return crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
    } catch (error) {
        const err = error as Error;
        console.error('verifySignature: unexpected error during timingSafeEqual', {
            name: err.name,
            message: err.message,
        });
    }
}