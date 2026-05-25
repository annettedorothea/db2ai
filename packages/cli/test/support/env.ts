export function restoreEnv(name: string, previousValue: string | undefined): void {
    if (previousValue === undefined) {
        delete process.env[name];
        return;
    }
    process.env[name] = previousValue;
}
