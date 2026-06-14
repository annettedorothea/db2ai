import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { compileGeneratedForSmoke } from '../generated/index.js';
import { copyAuthStubsFromDemos } from './copy-auth-stubs-from-demos.js';
import { copyLoggingAdapterStub } from './copy-logging-adapter-stub.js';
import { ensurePagilaDocker } from './pagila-docker.js';
import { demosRoot, demosTmpRoot } from './paths.js';
import { runDemoGenerate } from './run-demo-generate.js';

export { demosRoot };
export const pagilaSourcePath = path.join(demosRoot, 'pagila.db2ai');
export const pagilaDatabaseEnv = 'PAGILA_DATABASE_URL';
export const pagilaTmpRoot = demosTmpRoot;

export type PagilaGeneratedFixture = {
    fixtureRoot: string;
    generatedJsPath: string;
    stdioMcpServerPath: string;
};

export async function preparePagilaGeneratedFixture(fixtureRoot: string): Promise<PagilaGeneratedFixture> {
    const generatedTsPath = path.join(fixtureRoot, 'generated/tools/pagila-tools.ts');
    const generatedJsPath = path.join(fixtureRoot, 'generated/tools/pagila-tools.js');
    const stdioMcpServerPath = path.join(fixtureRoot, 'generated/cli/stdio-mcp-server.js');

    await fs.mkdir(fixtureRoot, { recursive: true });
    await copyLoggingAdapterStub(fixtureRoot);
    await copyAuthStubsFromDemos(fixtureRoot, 'pagila-tools');
    const generateSourcePath = path.join(fixtureRoot, path.basename(pagilaSourcePath));
    await fs.copyFile(pagilaSourcePath, generateSourcePath);
    runDemoGenerate(generateSourcePath, generatedTsPath);
    compileGeneratedForSmoke(fixtureRoot);

    return { fixtureRoot, generatedJsPath, stdioMcpServerPath };
}

export { ensurePagilaDocker };
