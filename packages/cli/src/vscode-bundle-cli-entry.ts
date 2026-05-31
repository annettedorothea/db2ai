/**
 * Bundled into the VS Code extension VSIX (see packages/extension/scripts/embed-cli-bundle.mjs).
 */
import { Db2AiDslLanguageMetaData } from 'db-2-ai-dsl-language';
import { Command } from 'commander';
import { generateAction } from './generate-command.js';

declare const __DB2AI_CLI_BUNDLE_VERSION__: string;

async function main(): Promise<void> {
    const program = new Command();
    program.name('db2ai').version(__DB2AI_CLI_BUNDLE_VERSION__);
    const fileExtensions = Db2AiDslLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (extensions: ${fileExtensions})`)
        .argument('<destination>', 'destination file')
        .description('Generates MCP tool code for a .db2ai source file.')
        .action(generateAction);
    await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
});
