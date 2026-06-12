import type { CheckedHostContext, InvokeOptions } from '../../../generated/tools/orders-postgres-tools.js';

type JwtPayload = Record<string, unknown>;

export function checkListCustomerOrdersParameters(options: InvokeOptions, host: CheckedHostContext): InvokeOptions {
    const jwt = requireJwtInHostContext(host);
    const jwtCustomer = requireCustomerIdClaim(jwt);
    const role = requireRoleClaim(jwt);
    const customerId = resolveCustomerId(options, jwtCustomer);
    assertUserMayOnlyAccessOwnCustomer(role, customerId, jwtCustomer);
    assertRoleIsUserOrAdmin(role);

    return {
        ...options,
        customerId
    };
}

function requireJwtInHostContext(host: CheckedHostContext): JwtPayload {
    const jwt = host.jwt;
    if (!jwt || typeof jwt !== 'object') {
        throw new Error('listCustomerOrders requires a JWT in host context (--auth-env).');
    }
    return jwt;
}

function requireCustomerIdClaim(jwt: JwtPayload): string {
    const jwtCustomer = String(jwt.customerId ?? '').trim();
    if (jwtCustomer.length === 0) {
        throw new Error('JWT payload missing customerId claim.');
    }
    return jwtCustomer;
}

function requireRoleClaim(jwt: JwtPayload): string {
    const role = String(jwt.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
    }
    return role;
}

function resolveCustomerId(options: InvokeOptions, jwtCustomer: string): string {
    let customerId = options.customerId;
    if (customerId == null || String(customerId).trim() === '') {
        customerId = jwtCustomer;
    }
    return String(customerId).trim();
}

function assertUserMayOnlyAccessOwnCustomer(role: string, customerId: string, jwtCustomer: string): void {
    if (role === 'user' && customerId !== jwtCustomer) {
        throw new Error(`customerId "${customerId}" does not match JWT claim "${jwtCustomer}".`);
    }
}

function assertRoleIsUserOrAdmin(role: string): void {
    if (role !== 'user' && role !== 'admin') {
        throw new Error(`Unsupported role "${role}".`);
    }
}
