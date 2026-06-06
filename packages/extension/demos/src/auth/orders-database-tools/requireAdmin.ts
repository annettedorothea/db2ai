import type { CheckedHostContext } from '../../../generated/tools/orders-database-tools.js';

export function requireAdmin(host: CheckedHostContext): void {
    const jwt = host.jwt;
    if (!jwt || typeof jwt !== 'object') {
        throw new Error('Admin-only tool requires a JWT in host context (--auth-env).');
    }
    const role = String(jwt.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
    }
    if (role !== 'admin') {
        throw new Error(`Admin role required; JWT role is "${role}".`);
    }
}
