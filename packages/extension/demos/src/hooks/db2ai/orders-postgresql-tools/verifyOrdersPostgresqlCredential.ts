import { decodeJwtPayload } from '../../shared/decode-jwt-payload.js';

export async function verifyOrdersPostgresqlCredential(credential: string): Promise<void> {
    await decodeJwtPayload(credential);
}

export { verifyOrdersPostgresqlCredential as verifyCredential };
