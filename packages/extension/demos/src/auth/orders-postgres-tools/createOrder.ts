import type { CheckedHostContext, InvokeOptions } from '../../../generated/tools/orders-postgres-tools.js';

export function checkCreateOrderParameters(options: InvokeOptions, host: CheckedHostContext): InvokeOptions {
    const claims = host.sessionClaims;
    if (!claims || typeof claims !== 'object') {
        throw new Error('createOrder requires sessionClaims in host context.');
    }
    const jwtCustomer = String(claims.customerId ?? '').trim();
    if (jwtCustomer.length === 0) {
        throw new Error('JWT payload missing customerId claim.');
    }
    const role = String(claims.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
    }

    if (options.productId == null || String(options.productId).trim() === '') {
        throw new Error('createOrder requires productId.');
    }

    let customerId = options.customerId;
    if (customerId == null || String(customerId).trim() === '') {
        customerId = jwtCustomer;
    }
    const normalized = String(customerId).trim();
    if (role === 'user' && normalized !== jwtCustomer) {
        throw new Error(`customerId "${normalized}" does not match JWT claim "${jwtCustomer}".`);
    }
    if (role !== 'user' && role !== 'admin') {
        throw new Error(`Unsupported role "${role}".`);
    }

    return {
        ...options,
        customerId: normalized,
        productId: options.productId
    };
}
