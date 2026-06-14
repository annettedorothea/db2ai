import type { CheckedHostContext } from '../../../generated/tools/orders-postgres-tools.js';

export function requireAdmin(host: CheckedHostContext): void {
    const claims = host.sessionClaims;
    if (!claims || typeof claims !== 'object') {
        throw new Error('Admin-only tool requires sessionClaims in host context.');
    }
    const role = String(claims.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
    }
    if (role !== 'admin') {
        throw new Error(`Admin role required; JWT role is "${role}".`);
    }
}
