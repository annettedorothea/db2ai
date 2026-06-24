export class SakilaMysqlCredentials {
    toString() {
        return '[sakila env auth]';
    }
}
export function toSakilaMysqlCredentials(_data) {
    return new SakilaMysqlCredentials();
}
export async function verifySakilaMysqlCredentials(input) {
    const expected = process.env.MCP_AUTH_EXPECTED?.trim();
    if (!expected) {
        throw new Error('MCP_AUTH_EXPECTED is not set (expected MCP auth env value).');
    }
    const inbound = String(input.inboundCredential).trim();
    if (inbound !== expected) {
        throw new Error('Invalid MCP auth credential for sakila demo.');
    }
    return {
        upstreamCredential: inbound,
        credentials: toSakilaMysqlCredentials()
    };
}
export { verifySakilaMysqlCredentials as verifyCredential, toSakilaMysqlCredentials as toModuleCredentials };
