import { isModel } from 'db-2-ai-dsl-language';
import chalk from 'chalk';
import * as path from 'node:path';
import { generateOutput } from './generator.js';
import { assertDocumentValidOrExit } from './document-actions.js';

export async function generateAction(source: string, destination: string): Promise<void> {
    const document = await assertDocumentValidOrExit(source);
    const model = document.parseResult.value;
    if (!isModel(model)) {
        console.error(chalk.red(`Cannot generate: ${path.basename(source)} is not a valid db2ai model.`));
        process.exit(1);
    }
    const generatedFiles = await generateOutput(model, source, destination);
    console.log(chalk.green('Code generated successfully:'));
    console.log(chalk.green(`- TS: ${generatedFiles.tsPath}`));
    console.log(chalk.green(`- MCP runtimes: ${generatedFiles.mcpRuntimePaths.stdioRuntimePath}`));
    for (const serverPath of generatedFiles.moduleMcpServerPaths) {
        console.log(chalk.green(`- MCP server: ${serverPath}`));
    }
}
