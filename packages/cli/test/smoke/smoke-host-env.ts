import type { McpHostAdapter } from '@core2ai/core/mcp-host';

const SMOKE_CREDENTIAL_ENV = 'MCP_HOST_CREDENTIAL';

/** Smoke: optional JWT via generated adapter (--auth-env) plus connection string in process.env. */
export function applySmokeHostEnv(adapter: McpHostAdapter, host: { credential?: string }, envDirs: string[]): void {
    const argv: string[] = [];
    if (host.credential !== undefined && host.credential !== '') {
        argv.push('--auth-env', SMOKE_CREDENTIAL_ENV);
    }
    if (argv.length > 0) {
        adapter.configureFromArgv(argv, envDirs);
        process.env[SMOKE_CREDENTIAL_ENV] = host.credential;
    } else {
        adapter.configureFromArgv([], envDirs);
    }
}
