/**
 * MCP credential verification (write-once — implement verifyPlantsOracleCredentials).
 * Used by oauth-http gate and by invokeTool for protected tools (stdio/relay/OAuth).
 */
export type ModuleCredentials = Record<string, unknown>;

export class PlantsOracleCredentials implements ModuleCredentials {
    [key: string]: unknown;

    constructor(init: ModuleCredentials) {
        Object.assign(this, init);
    }

    toString(): string {
        return '[PlantsOracle credentials]';
    }
}

export function toPlantsOracleCredentials(data: ModuleCredentials | Record<string, unknown>): PlantsOracleCredentials {
    return new PlantsOracleCredentials(data as ModuleCredentials);
}

export type VerifyCredentialInput = {
    inboundCredential: string;
};

export type VerifyCredentialResult = {
    upstreamCredential: string;
    credentials: PlantsOracleCredentials;
};

export async function verifyPlantsOracleCredentials(input: VerifyCredentialInput): Promise<VerifyCredentialResult> {
    void input;
    throw new Error(
        'Implement verifyPlantsOracleCredentials in src/auth/db2ai/plants-oracle-tools/verifyPlantsOracleCredentials.ts'
    );
}

export { verifyPlantsOracleCredentials as verifyCredential, toPlantsOracleCredentials as toModuleCredentials };
