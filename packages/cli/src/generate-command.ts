import type { Model } from 'db-2-ai-dsl-language';
import { createDb2AiDslServices } from 'db-2-ai-dsl-language';
import { extractAstNode } from '@core2ai/codegen';
import chalk from 'chalk';
import * as path from 'node:path';
import { NodeFileSystem } from 'langium/node';
import { generateOutput } from './generator.js';
import { loadLocalEnvFiles } from './env.js';

export async function generateAction(source: string, destination: string): Promise<void> {
    loadLocalEnvFiles([process.cwd(), path.dirname(path.resolve(source))]);
    const services = createDb2AiDslServices(NodeFileSystem).Db2AiDsl;
    const model = await extractAstNode<Model>(source, services);
    const generatedFiles = await generateOutput(model, source, destination);
    console.log(chalk.green('Code generated successfully:'));
    console.log(chalk.green(`- TS: ${generatedFiles.tsPath}`));
    console.log(chalk.green(`- JS: ${generatedFiles.jsPath}`));
    console.log(chalk.green(`- MCP host: ${generatedFiles.mcpServePath}`));
}
