import chalk from 'chalk';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

export type DbInvokeArgs = {
    limit?: number;
    offset?: number;
};

type GeneratedRuntimeModule = {
    generatedTools: Array<{ toolName: string }>;
    invokeTool: (toolName: string, options?: DbInvokeArgs) => Promise<unknown>;
};

function defaultSmokeArgs(toolName: string): DbInvokeArgs {
    if (toolName.startsWith('list')) {
        return { limit: 5, offset: 0 };
    }
    return { limit: 5, offset: 0 };
}

async function importGeneratedModule(modulePath: string): Promise<GeneratedRuntimeModule> {
    if (modulePath.startsWith('file://')) {
        throw new Error('smoke-generated accepts local file paths only (no file:// URLs).');
    }
    const imported = await import(pathToFileURL(path.resolve(modulePath)).href);
    const generatedTools = (imported as { generatedTools?: unknown }).generatedTools;
    const invokeTool = (imported as { invokeTool?: unknown }).invokeTool;
    if (!Array.isArray(generatedTools) || typeof invokeTool !== 'function') {
        throw new Error(`Generated module "${modulePath}" is missing required exports (generatedTools, invokeTool).`);
    }
    return {
        generatedTools: generatedTools as GeneratedRuntimeModule['generatedTools'],
        invokeTool: invokeTool as GeneratedRuntimeModule['invokeTool']
    };
}

export async function runSmokeGenerated(modulePath: string, toolName: string, argsJson?: string): Promise<void> {
    const generated = await importGeneratedModule(modulePath);
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

    const result = await generated.invokeTool(toolName, args);
    console.log(chalk.green(`Smoke test passed for "${toolName}".`));
    console.log(JSON.stringify(result, null, 2));
}
