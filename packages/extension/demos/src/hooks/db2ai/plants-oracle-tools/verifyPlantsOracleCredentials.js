export class PlantsOracleCredentials {
    constructor(init) {
        Object.assign(this, init);
    }
    toString() {
        return '[PlantsOracle credentials]';
    }
}
export function toPlantsOracleCredentials(data) {
    return new PlantsOracleCredentials(data);
}
export async function verifyPlantsOracleCredentials(input) {
    void input;
    throw new Error('Implement verifyPlantsOracleCredentials in src/auth/db2ai/plants-oracle-tools/verifyPlantsOracleCredentials.ts');
}
export { verifyPlantsOracleCredentials as verifyCredential, toPlantsOracleCredentials as toModuleCredentials };
