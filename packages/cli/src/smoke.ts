import chalk from 'chalk';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadLocalEnvFiles, readGeneratedModule } from '@core2ai/mcp-host';
import { applySmokeHostEnv } from './smoke-host-env.js';

export type DbInvokeArgs = Record<string, unknown>;

function defaultSmokeArgs(toolName: string): DbInvokeArgs {
    if (toolName.startsWith('list')) {
        return { limit: 5, offset: 0 };
    }
    return { limit: 5, offset: 0 };
}

function resolveSmokeCredential(): string | undefined {
    return (
        process.env.DB2AI_USER_JWT?.trim() ||
        process.env.DB2AI_SMOKE_CREDENTIAL?.trim() ||
        undefined
    );
}

export async function runSmokeGenerated(modulePath: string, toolName: string, argsJson?: string): Promise<void> {
    if (modulePath.startsWith('file://')) {
        throw new Error('smoke-generated accepts local file paths only (no file:// URLs).');
    }
    const resolved = path.resolve(modulePath);
    const envDirs = [process.cwd(), path.dirname(resolved)];
    loadLocalEnvFiles(envDirs);

    const imported = await import(pathToFileURL(resolved).href);
    const generated = readGeneratedModule(imported as Record<string, unknown>);

    const connectionEnv = (imported as { connectionEnv?: unknown }).connectionEnv;
    if (typeof connectionEnv !== 'string' || connectionEnv.trim().length === 0) {
        throw new Error(`Generated module "${modulePath}" is missing export connectionEnv.`);
    }
    const connectionString = process.env[connectionEnv.trim()]?.trim();
    if (!connectionString) {
        throw new Error(`Set environment variable "${connectionEnv.trim()}" for smoke-generated.`);
    }

    const credential = resolveSmokeCredential();
    applySmokeHostEnv(generated.adapter, { credential }, envDirs);
    generated.adapter.validateAtStartup(generated.requiresAuth === true);

    const tool = generated.generatedTools.find(item => item.toolName === toolName);
    if (!tool) {
        const available = generated.generatedTools.map(item => item.toolName).join(', ');
        console.error(chalk.red(`Tool "${toolName}" not found. Available tools: ${available}`));
        process.exit(1);
    }

    let args: DbInvokeArgs = {};
    if (argsJson) {
        try {
            const argsContent = argsJson.startsWith('@')
                ? fs.readFileSync(argsJson.slice(1), 'utf-8')
                : argsJson;
            args = JSON.parse(argsContent) as DbInvokeArgs;
        } catch (error) {
            console.error(chalk.red(`Invalid args JSON: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    }
    if (!argsJson) {
        args = defaultSmokeArgs(toolName);
    }

    const hostContext = generated.adapter.resolveHostContext();
    const result = await generated.invokeTool(toolName, args, hostContext);
    console.log(chalk.green(`Smoke test passed for "${toolName}".`));
    console.log(JSON.stringify(result, null, 2));
}
