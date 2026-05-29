import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDbMcpSmoke } from './mcp-smoke.js';
import { ensureAccessDemoDocker } from '../support/access-demo-docker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, '../../..');
const workspaceRoot = path.resolve(cliRoot, '../..');
const demosRoot = path.join(workspaceRoot, 'packages/extension/demos');
const accessDemoSourcePath = path.join(demosRoot, 'access-demo.db2ai');
const authStubPath = path.join(demosRoot, 'src/auth/listCustomerOrders.ts');
const tmpRoot = path.join(cliRoot, 'tmp');

const ALICE_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6InRlbmFudC1hIiwiY3VzdG9tZXJJZCI6ImFsaWNlIiwicm9sZSI6InVzZXIifQ.WLGTyTsQYifid-RLt6mjlr7EPbHVPrW7j_yHuB1jTC8';

export async function runAccessDemoMcpSmoke(): Promise<void> {
    const { connectionString } = await ensureAccessDemoDocker(demosRoot);
    const runRoot = await fs.mkdtemp(path.join(tmpRoot, 'access-demo-mcp-'));
    const fixtureRoot = path.join(runRoot, 'fixture');
    const fixtureSource = path.join(fixtureRoot, 'access-demo.db2ai');
    const generatedToolsName = 'access-demo-tools';
    const shared = {
        sourcePath: fixtureSource,
        tmpRoot: fixtureRoot,
        generatedToolsName,
        envName: 'ACCESS_DEMO_DATABASE_URL',
        connectionString,
        hostArgs: ['--auth-env', 'ACCESS_DEMO_TOKEN'] as string[],
        extraEnv: {
            ACCESS_DEMO_TOKEN: ALICE_TOKEN
        }
    };

    try {
        await fs.mkdir(path.join(fixtureRoot, 'src', 'auth'), { recursive: true });
        await fs.copyFile(accessDemoSourcePath, fixtureSource);
        await fs.copyFile(authStubPath, path.join(fixtureRoot, 'src/auth/listCustomerOrders.ts'));

        await runDbMcpSmoke({
            ...shared,
            label: 'access-demo public',
            tmpPrefix: 'access-demo-public-',
            toolName: 'listProducts',
            toolArgs: { limit: 5 }
        });

        await runDbMcpSmoke({
            ...shared,
            label: 'access-demo checked',
            tmpPrefix: 'access-demo-checked-',
            toolName: 'listCustomerOrders',
            toolArgs: {}
        });

        console.log('MCP access-demo smoke passed.');
    } finally {
        await fs.rm(runRoot, { recursive: true, force: true });
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    runAccessDemoMcpSmoke().catch((error) => {
        console.error(error instanceof Error ? error.stack : String(error));
        process.exit(1);
    });
}
