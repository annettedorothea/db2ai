import { decodeJwtPayload } from '../../shared/decode-jwt-payload.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/orders-postgresql-tools.js';

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

/** protected + prepareToolCall — fill optional customerId, scope for role=user. */
export async function prepareToolCallForListCustomerOrders(
    options: InvokeOptions,
    credential: string
): Promise<InvokeOptions> {
    const claims = await decodeJwtPayload(credential);
    const jwtCustomer = String(claims.customerId ?? '').trim();
    const role = String(claims.role ?? '').trim();

    let customerId = options.customerId;
    if (customerId == null || String(customerId).trim() === '') {
        customerId = jwtCustomer;
    }
    const normalized = String(customerId).trim();
    if (role === 'user' && normalized !== jwtCustomer) {
        throw new Error(`customerId "${normalized}" does not match JWT claim "${jwtCustomer}".`);
    }

    return {
        ...options,
        customerId: normalized
    };
}
