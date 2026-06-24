export class PagilaPostgresqlCredentials {
    toString() {
        return '[pagila env auth]';
    }
}
export function toPagilaPostgresqlCredentials(_data) {
    return new PagilaPostgresqlCredentials();
}
export async function verifyPagilaPostgresqlCredentials(input) {
    const expected = process.env.MCP_AUTH_EXPECTED?.trim();
    if (!expected) {
        throw new Error('MCP_AUTH_EXPECTED is not set (expected MCP auth env value).');
    }
    const inbound = String(input.inboundCredential).trim();
    if (inbound !== expected) {
        throw new Error('Invalid MCP auth credential for pagila demo.');
    }
    return {
        upstreamCredential: inbound,
        credentials: toPagilaPostgresqlCredentials()
    };
}
export { verifyPagilaPostgresqlCredentials as verifyCredential, toPagilaPostgresqlCredentials as toModuleCredentials };
