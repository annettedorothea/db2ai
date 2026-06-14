import {
    Db2AiDslLanguageMetaData,
    createDb2AiDslServices,
    isModel,
    validateSqlBlocksWithExamples
} from 'db-2-ai-dsl-language';
import {
    assertDocumentValidForGenerate,
    collectLangiumDocumentErrors,
    printDocumentValidationErrors,
    type CliLangiumDocument
} from '@core2ai/core/codegen';
import chalk from 'chalk';
import type { LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';
import * as path from 'node:path';
import { DiagnosticSeverity, type Diagnostic } from 'vscode-languageserver-types';
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

async function loadDocument(file: string, validation: boolean): Promise<LangiumDocument> {
    checkExtension(file);
    const services = createDb2AiDslServices(NodeFileSystem);
    const uri = URI.file(path.resolve(file));
    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(uri);
    await services.shared.workspace.DocumentBuilder.build([document], { validation });
    return document;
}

function collectSqlDbDiagnostics(document: CliLangiumDocument, file: string) {
    const model = document.parseResult?.value;
    if (!isModel(model)) {
        return [];
    }
    const uri = document.uri?.toString() ?? URI.file(path.resolve(file)).toString();
    return validateSqlBlocksWithExamples(model, uri);
}

function printSqlDbWarnings(document: CliLangiumDocument, warnings: Diagnostic[]): void {
    for (const diagnostic of warnings) {
        const hasRange =
            diagnostic.range.start.line > 0 ||
            diagnostic.range.start.character > 0 ||
            (diagnostic.range.end?.character ?? diagnostic.range.start.character) > diagnostic.range.start.character;
        const location = hasRange ? `line ${diagnostic.range.start.line + 1}: ` : '';
        console.error(chalk.yellow(`${location}${diagnostic.message}`));
    }
}

export async function assertDocumentValidOrExit(file: string): Promise<LangiumDocument> {
    const services = createDb2AiDslServices(NodeFileSystem).Db2AiDsl;
    let sqlDbWarnings: Diagnostic[] = [];

    const document = (await assertDocumentValidForGenerate(file, services, {
        beforeBuild: () => loadLocalEnvFiles([process.cwd(), path.dirname(path.resolve(file))]),
        extraErrors: async (doc: CliLangiumDocument) => {
            const sqlDbDiags = await collectSqlDbDiagnostics(doc, file);
            sqlDbWarnings = sqlDbDiags.filter((d) => d.severity === DiagnosticSeverity.Warning);
            return sqlDbDiags
                .filter((d) => d.severity === DiagnosticSeverity.Error)
                .map((d) => ({
                    severity: d.severity,
                    message: d.message,
                    range: d.range
                }));
        }
    })) as LangiumDocument;

    if (sqlDbWarnings.length > 0) {
        printSqlDbWarnings(document, sqlDbWarnings);
    }

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
    const sqlDbDiags = await collectSqlDbDiagnostics(document, file);
    const errors = [
        ...collectLangiumDocumentErrors(document),
        ...sqlDbDiags
            .filter((d) => d.severity === DiagnosticSeverity.Error)
            .map((d) => ({
                severity: d.severity,
                message: d.message,
                range: d.range
            }))
    ];
    const warnings = [
        ...(document.diagnostics ?? []).filter((d) => d.severity === DiagnosticSeverity.Warning),
        ...sqlDbDiags.filter((d) => d.severity === DiagnosticSeverity.Warning)
    ];

    if (errors.length > 0) {
        printDocumentValidationErrors(document, errors);
        process.exit(1);
    }
    for (const diagnostic of warnings) {
        console.error(chalk.yellow(diagnostic.message));
    }
    console.log(chalk.green(`Validated ${file} successfully.`));
}
