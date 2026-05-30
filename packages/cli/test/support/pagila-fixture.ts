import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAction } from '../../src/generate-command.js';
import { compileGeneratedForSmoke } from './compile-generated-fixture.js';
import { ensurePagilaDocker } from './pagila-docker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../../..');
const cliRoot = path.resolve(__dirname, '../..');
export const demosRoot = path.join(workspaceRoot, 'packages/extension/demos');
export const pagilaSourcePath = path.join(demosRoot, 'pagila.db2ai');
export const pagilaDatabaseEnv = 'PAGILA_DATABASE_URL';
export const pagilaTmpRoot = path.join(cliRoot, 'tmp');

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
    await generateAction(pagilaSourcePath, generatedTsPath);
    compileGeneratedForSmoke(fixtureRoot);

    return { fixtureRoot, generatedJsPath, mcpServePath };
}

export { ensurePagilaDocker };
