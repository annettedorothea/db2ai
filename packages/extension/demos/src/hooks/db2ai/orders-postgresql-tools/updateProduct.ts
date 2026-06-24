import type { ModuleCredentials } from './verifyOrdersPostgresqlCredentials.js';

export function authorizeUpdateProduct(credentials: ModuleCredentials): void {
    const role = String(credentials.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
    }
    if (role !== 'admin') {
        throw new Error(`Admin role required; JWT role is "${role}".`);
    }
}
