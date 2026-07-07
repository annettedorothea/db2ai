import { decodeJwtPayload } from '../../shared/decode-jwt-payload.js';

export async function checkToolAccessForDeleteProduct(credential: string): Promise<void> {
    const claims = await decodeJwtPayload(credential);
    const role = String(claims.role ?? '').trim();
    if (role !== 'admin') {
        throw new Error(`Admin role required to delete products; JWT role is "${role || 'unknown'}".`);
    }
}
