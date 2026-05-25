import { Db2AiDslLanguageMetaData } from 'db-2-ai-dsl-language';
import { Command } from 'commander';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as url from 'node:url';
import { generateAction } from './generate-command.js';
import { loadLocalEnvFiles } from './env.js';
import { parseAction, validateAction } from './document-actions.js';
import { runSmokeGenerated } from './smoke.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const packagePath = path.resolve(__dirname, '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const smokeGeneratedAction = async (
    generatedModulePath: string,
    toolName: string,
    argsJson?: string
): Promise<void> => {
    loadLocalEnvFiles([process.cwd(), path.dirname(path.resolve(generatedModulePath))]);
    await runSmokeGenerated(generatedModulePath, toolName, argsJson);
};

export default function (): void {
    const program = new Command();
    program.version(JSON.parse(packageContent).version);

    const fileExtensions = Db2AiDslLanguageMetaData.fileExtensions.join(', ');

    program
        .command('parse')
        .argument('<file>', `source file (extensions: ${fileExtensions})`)
        .description('Parse a .db2ai file and report parser errors.')
        .action(parseAction);

    program
        .command('validate')
        .argument('<file>', `source file (extensions: ${fileExtensions})`)
        .description('Parse and run Langium validation on a .db2ai file.')
        .action(validateAction);

    program
        .command('generate')
        .argument('<file>', `source file (extensions: ${fileExtensions})`)
        .argument('<destination>', 'destination .ts file (companion .mjs is written alongside)')
        .description('Generate MCP tool modules from a .db2ai file.')
        .action(generateAction);

    program
        .command('smoke-generated')
        .argument('<generatedModule>', 'path to generated *-tools.mjs')
        .argument('<toolName>', 'tool name from generated module')
        .argument('[argsJson]', 'optional JSON args, e.g. {"limit":5,"offset":0}')
        .description('Invoke one generated tool directly.')
        .action(smokeGeneratedAction);

    program.parse(process.argv);
}
