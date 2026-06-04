import type { CheckedHostContext, InvokeOptions } from '../../generated/tools/orders-demo-tools.js';

export function checkListCustomerOrdersParameters(options: InvokeOptions, host: CheckedHostContext): InvokeOptions {
    const jwt = host.jwt;
    if (!jwt || typeof jwt !== 'object') {
        throw new Error('listCustomerOrders requires a JWT in host context (--auth-env).');
    }
    const jwtCustomer = String(jwt.customerId ?? '').trim();
    if (jwtCustomer.length === 0) {
        throw new Error('JWT payload missing customerId claim.');
    }
    const role = String(jwt.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
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
        customerId: normalized
    };
}
