import { decodeJwtPayload } from '../../shared/decode-jwt-payload.js';

/** protected + checkToolAccess — role gate (user | admin). */
export async function checkToolAccessForListCustomerOrders(credential: string): Promise<void> {
    const claims = await decodeJwtPayload(credential);
    const jwtCustomer = String(claims.customerId ?? '').trim();
    if (jwtCustomer.length === 0) {
        throw new Error('JWT payload missing customerId claim.');
    }
    const role = String(claims.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
    }
    if (role !== 'user' && role !== 'admin') {
        throw new Error(`Unsupported role "${role}".`);
    }
}
