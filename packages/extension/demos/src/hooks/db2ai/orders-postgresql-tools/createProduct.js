export function authorizeCreateProduct(credentials) {
    const role = String(credentials.role ?? '').trim();
    if (role.length === 0) {
        throw new Error('JWT payload missing role claim.');
    }
    if (role !== 'admin') {
        throw new Error(`Admin role required; JWT role is "${role}".`);
    }
}
