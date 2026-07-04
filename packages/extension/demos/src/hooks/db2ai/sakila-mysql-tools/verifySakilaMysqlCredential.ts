export async function verifySakilaMysqlCredential(credential: string): Promise<void> {
    const expected = process.env.MCP_AUTH_EXPECTED?.trim();
    if (!expected) {
        throw new Error('MCP_AUTH_EXPECTED is not set (expected MCP auth env value).');
    }
    if (credential.trim() !== expected) {
        throw new Error('Invalid MCP auth credential for sakila demo.');
    }
}

export { verifySakilaMysqlCredential as verifyCredential };
