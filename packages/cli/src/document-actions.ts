import { Db2AiDslLanguageMetaData, createDb2AiDslServices } from 'db-2-ai-dsl-language';
import chalk from 'chalk';
import { NodeFileSystem } from 'langium/node';
import * as path from 'node:path';
import { URI } from 'vscode-uri';
import { loadLocalEnvFiles } from './env.js';

function checkExtension(file: string): void {
    const extension = path.extname(file);
    const allowed = Db2AiDslLanguageMetaData.fileExtensions;
    if (!(allowed as readonly string[]).includes(extension)) {
        console.error(chalk.red(`Expected file extension: ${allowed.join(' or ')}`));
        process.exit(1);
    }
}

async function loadDocument(file: string, validation: boolean) {
    checkExtension(file);
    const services = createDb2AiDslServices(NodeFileSystem);
    const uri = URI.file(path.resolve(file));
    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(uri);
    await services.shared.workspace.DocumentBuilder.build([document], { validation });
    return document;
}

export async function parseAction(file: string): Promise<void> {
    const document = await loadDocument(file, false);
    const errors = document.parseResult.parserErrors;
    if (errors.length > 0) {
        for (const error of errors) {
            console.error(chalk.red(error.message));
        }
        process.exit(1);
    }
    console.log(chalk.green(`Parsed ${file} successfully.`));
}

export async function validateAction(file: string): Promise<void> {
    loadLocalEnvFiles([process.cwd(), path.dirname(path.resolve(file))]);
    const document = await loadDocument(file, true);
    const parserErrors = document.parseResult.parserErrors;
    if (parserErrors.length > 0) {
        for (const error of parserErrors) {
            console.error(chalk.red(error.message));
        }
        process.exit(1);
    }
    const diagnostics = (document.diagnostics ?? []).filter((d) => d.severity === 1);
    if (diagnostics.length > 0) {
        for (const diagnostic of diagnostics) {
            console.error(chalk.red(diagnostic.message));
        }
        process.exit(1);
    }
    console.log(chalk.green(`Validated ${file} successfully.`));
}
