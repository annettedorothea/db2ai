export class AnimalsSqlserverCredentials {
    constructor(init) {
        Object.assign(this, init);
    }
    toString() {
        return '[AnimalsSqlserver credentials]';
    }
}
export function toAnimalsSqlserverCredentials(data) {
    return new AnimalsSqlserverCredentials(data);
}
export async function verifyAnimalsSqlserverCredentials(input) {
    void input;
    throw new Error('Implement verifyAnimalsSqlserverCredentials in src/auth/db2ai/animals-sqlserver-tools/verifyAnimalsSqlserverCredentials.ts');
}
export { verifyAnimalsSqlserverCredentials as verifyCredential, toAnimalsSqlserverCredentials as toModuleCredentials };
