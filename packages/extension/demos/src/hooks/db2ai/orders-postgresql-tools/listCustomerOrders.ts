import type { ModuleCredentials } from './verifyOrdersPostgresqlCredentials.js';
import type { InvokeOptions } from '../../../../generated/db2ai/tools/orders-postgresql-tools.js';

/** protected + authorize — role gate (user | admin). */
export function authorizeListCustomerOrders(credentials: ModuleCredentials): void {
    const jwtCustomer = String(credentials.customerId ?? '').trim();
    if (jwtCustomer.length === 0) {
        throw new Error('JWT payload missing customerId claim.');
    }
    const role = String(credentials.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
    }
    if (role !== 'user' && role !== 'admin') {
        throw new Error(`Unsupported role "${role}".`);
    }
}

/** protected + prepare — fill optional customerId, scope for role=user. */
export function prepareListCustomerOrdersInput(options: InvokeOptions, credentials?: ModuleCredentials): InvokeOptions {
    if (!credentials) {
        throw new Error('Prepare requires credentials.');
    }
    const jwtCustomer = String(credentials.customerId ?? '').trim();
    const role = String(credentials.role ?? '').trim();

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
