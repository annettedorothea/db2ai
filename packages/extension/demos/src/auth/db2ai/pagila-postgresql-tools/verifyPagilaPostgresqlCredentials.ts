export type ModuleCredentials = Record<string, unknown>;

export class PagilaPostgresqlCredentials implements ModuleCredentials {
    [key: string]: unknown;

    toString(): string {
        return '[pagila env auth]';
    }
}

export function toPagilaPostgresqlCredentials(
    _data?: ModuleCredentials | Record<string, unknown>
): PagilaPostgresqlCredentials {
    return new PagilaPostgresqlCredentials();
}

export type VerifyCredentialInput = {
    inboundCredential: string;
};

export type VerifyCredentialResult = {
    upstreamCredential: string;
    credentials: PagilaPostgresqlCredentials;
};

export async function verifyPagilaPostgresqlCredentials(input: VerifyCredentialInput): Promise<VerifyCredentialResult> {
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
