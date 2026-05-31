import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { compileGeneratedForSmoke } from '@core2ai/core/test-fixtures';
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
    mcpServePath: string;
};

export async function preparePagilaGeneratedFixture(fixtureRoot: string): Promise<PagilaGeneratedFixture> {
    const generatedTsPath = path.join(fixtureRoot, 'generated/tools/pagila-tools.ts');
    const generatedJsPath = path.join(fixtureRoot, 'generated/tools/pagila-tools.js');
    const mcpServePath = path.join(fixtureRoot, 'generated/cli/mcp-serve.js');

    await fs.mkdir(fixtureRoot, { recursive: true });
    runDemoGenerate(pagilaSourcePath, generatedTsPath);
    compileGeneratedForSmoke(fixtureRoot);

    return { fixtureRoot, generatedJsPath, mcpServePath };
}

export { ensurePagilaDocker };
