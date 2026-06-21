/**
 * MCP credential verification (write-once — implement verifySakilaMariadbCredentials).
 * Used by oauth-http gate and by invokeTool for protected tools (stdio/relay/OAuth).
 */
export type ModuleCredentials = Record<string, unknown>;

export class SakilaMariadbCredentials implements ModuleCredentials {
    [key: string]: unknown;

    constructor(init: ModuleCredentials) {
        Object.assign(this, init);
    }

    toString(): string {
        return '[SakilaMariadb credentials]';
    }
}

export function toSakilaMariadbCredentials(
    data: ModuleCredentials | Record<string, unknown>
): SakilaMariadbCredentials {
    return new SakilaMariadbCredentials(data as ModuleCredentials);
}

export type VerifyCredentialInput = {
    inboundCredential: string;
};

export type VerifyCredentialResult = {
    upstreamCredential: string;
    credentials: SakilaMariadbCredentials;
};

export async function verifySakilaMariadbCredentials(input: VerifyCredentialInput): Promise<VerifyCredentialResult> {
    void input;
    throw new Error(
        'Implement verifySakilaMariadbCredentials in src/auth/db2ai/sakila-mariadb-tools/verifySakilaMariadbCredentials.ts'
    );
}

export { verifySakilaMariadbCredentials as verifyCredential, toSakilaMariadbCredentials as toModuleCredentials };
