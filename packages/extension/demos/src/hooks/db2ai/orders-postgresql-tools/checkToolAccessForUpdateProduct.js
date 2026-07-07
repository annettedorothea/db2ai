import { decodeJwtPayload } from '../../shared/decode-jwt-payload.js';
export async function checkToolAccessForUpdateProduct(credential) {
    const claims = await decodeJwtPayload(credential);
    const role = String(claims.role ?? '').trim();
    if (role !== 'admin') {
        throw new Error(`Admin role required to update products; JWT role is "${role || 'unknown'}".`);
    }
}
