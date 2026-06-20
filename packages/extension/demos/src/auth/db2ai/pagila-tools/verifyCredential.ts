export type VerifyCredentialInput = {
    inboundCredential: string;
};

export type VerifyCredentialResult = {
    upstreamCredential: string;
    sessionClaims?: Record<string, unknown>;
};

export async function verifyCredential(input: VerifyCredentialInput): Promise<VerifyCredentialResult> {
    const expected = process.env.MCP_AUTH_EXPECTED?.trim();
    if (!expected) {
        throw new Error('MCP_AUTH_EXPECTED is not set (expected MCP auth header value).');
    }
    const inbound = String(input.inboundCredential).trim();
    if (inbound !== expected) {
        throw new Error('Invalid MCP auth credential for pagila demo.');
    }
    return { upstreamCredential: inbound };
}
