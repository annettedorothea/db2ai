#!/usr/bin/env node
/**
 * Mint a demo JWT for tests/direct-invoke: node get-token.mjs alice
 */
import { mintCustomerToken } from '../oauth-idp/jwt.mjs';

const customerId = process.argv[2];
if (!customerId) {
    console.error('Usage: node get-token.mjs <customerId>  (demo customers: admin, alice, bob)');
    process.exit(1);
}

const known = new Set(['admin', 'alice', 'bob']);
if (!known.has(customerId)) {
    console.error(`Unknown customerId: ${customerId}`);
    process.exit(1);
}

const role = customerId === 'admin' ? 'admin' : 'user';
console.log(mintCustomerToken(customerId, role));
