/**
 * MCP credential verification (write-once — implement verifyAnimalsSqlserverCredentials).
 * Used by oauth-http gate and by invokeTool for protected tools (stdio/relay/OAuth).
 */
export type ModuleCredentials = Record<string, unknown>;

export class AnimalsSqlserverCredentials implements ModuleCredentials {
    [key: string]: unknown;

    constructor(init: ModuleCredentials) {
        Object.assign(this, init);
    }

    toString(): string {
        return '[AnimalsSqlserver credentials]';
    }
}

export function toAnimalsSqlserverCredentials(
    data: ModuleCredentials | Record<string, unknown>
): AnimalsSqlserverCredentials {
    return new AnimalsSqlserverCredentials(data as ModuleCredentials);
}

export type VerifyCredentialInput = {
    inboundCredential: string;
};

export type VerifyCredentialResult = {
    upstreamCredential: string;
    credentials: AnimalsSqlserverCredentials;
};

export async function verifyAnimalsSqlserverCredentials(input: VerifyCredentialInput): Promise<VerifyCredentialResult> {
    void input;
    throw new Error(
        'Implement verifyAnimalsSqlserverCredentials in src/auth/db2ai/animals-sqlserver-tools/verifyAnimalsSqlserverCredentials.ts'
    );
}

export { verifyAnimalsSqlserverCredentials as verifyCredential, toAnimalsSqlserverCredentials as toModuleCredentials };
