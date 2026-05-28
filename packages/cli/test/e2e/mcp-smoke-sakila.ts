import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDbMcpSmoke } from './mcp-smoke.js';
import { ensureSakilaDocker } from '../support/sakila-docker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, '../../..');
const workspaceRoot = path.resolve(cliRoot, '../..');
const demosRoot = path.join(workspaceRoot, 'packages/extension/demos');
const sakilaSourcePath = path.join(demosRoot, 'sakila.db2ai');
const tmpRoot = path.join(cliRoot, 'tmp');

export async function runSakilaMcpSmoke(): Promise<void> {
    const { connectionString } = await ensureSakilaDocker(demosRoot);
    await runDbMcpSmoke({
        label: 'Sakila',
        sourcePath: sakilaSourcePath,
        tmpRoot,
        tmpPrefix: 'sakila-mcp-',
        generatedToolsName: 'sakila-tools',
        envName: 'SAKILA_DATABASE_URL',
        connectionString,
        toolName: 'searchFilms',
        toolArgs: {
            searchText: 'ACADEMY',
            maxRows: 5
        }
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    runSakilaMcpSmoke().catch((error) => {
        console.error(error instanceof Error ? error.stack : String(error));
        process.exit(1);
    });
}
