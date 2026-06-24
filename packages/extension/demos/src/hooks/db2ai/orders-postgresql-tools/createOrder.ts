import type { ModuleCredentials } from './verifyOrdersPostgresqlCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/orders-postgresql-tools.js';

export function prepareCreateOrderInput(options: InvokeOptions, credentials?: ModuleCredentials): InvokeOptions {
    if (!credentials) {
        throw new Error('Prepare requires credentials.');
    }
    const jwtCustomer = String(credentials.customerId ?? '').trim();
    if (jwtCustomer.length === 0) {
        throw new Error('JWT payload missing customerId claim.');
    }
    const role = String(credentials.role ?? '').trim();
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
