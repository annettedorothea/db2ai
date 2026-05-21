import type { LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import * as path from 'node:path';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';

let client: LanguageClient;
const generateByFileQueue = new Map<string, Promise<void>>();

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    client = await startLanguageClient(context);
    registerGenerateOnSave(context);
    registerGenerateCommand(context);
}

export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

async function startLanguageClient(context: vscode.ExtensionContext): Promise<LanguageClient> {
    const serverModule = context.asAbsolutePath(path.join('out', 'language', 'main.cjs'));
    const debugOptions = {
        execArgv: [
            '--nolazy',
            `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6010'}`
        ]
    };

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: '*', language: 'db-2-ai-dsl' }]
    };

    const languageClient = new LanguageClient(
        'db-2-ai-dsl',
        'db2ai-dsl',
        serverOptions,
        clientOptions
    );

    await languageClient.start();
    return languageClient;
}

function registerGenerateOnSave(context: vscode.ExtensionContext): void {
    const disposable = vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId !== 'db-2-ai-dsl') {
            return;
        }
        const sourcePath = document.uri.fsPath;
        const queued = generateByFileQueue.get(sourcePath) ?? Promise.resolve();
        const next = queued
            .catch(() => undefined)
            .then(async () => generateForSourceFile(context, sourcePath))
            .finally(() => {
                if (generateByFileQueue.get(sourcePath) === next) {
                    generateByFileQueue.delete(sourcePath);
                }
            });
        generateByFileQueue.set(sourcePath, next);
    });
    context.subscriptions.push(disposable);
}

function registerGenerateCommand(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand('db2ai.generateTools', async () => {
        const editor = vscode.window.activeTextEditor;
        const doc = editor?.document;
        if (!doc || doc.languageId !== 'db-2-ai-dsl') {
            void vscode.window.showWarningMessage(
                'db2ai: Open and focus a .db2ai file (db-2-ai-dsl) to generate tool code.'
            );
            return;
        }
        await generateForSourceFile(context, doc.uri.fsPath, { reportSuccess: true });
    });
    context.subscriptions.push(disposable);
}

type CliSpawn = {
    scriptPath: string;
    embedHome?: string;
};

async function generateForSourceFile(
    context: vscode.ExtensionContext,
    sourcePath: string,
    options?: { reportSuccess?: boolean }
): Promise<void> {
    const reportSuccess = options?.reportSuccess === true;
    const parsed = path.parse(sourcePath);
    const destinationPath = path.join(parsed.dir, 'generated', 'tools', `${parsed.name}-tools.ts`);
    const spawn = resolveCliSpawn(context);
    if (!spawn) {
        void vscode.window.showWarningMessage('db2ai: CLI entry not found, skipped generate.');
        return;
    }
    const env = spawn.embedHome?.length ? { ...process.env, DB2AI_EMBED_HOME: spawn.embedHome } : process.env;
    await new Promise<void>((resolve, reject) => {
        execFile(
            process.execPath,
            [spawn.scriptPath, 'generate', sourcePath, destinationPath],
            { env },
            (error, stdout, stderr) => {
                if (error) {
                    const details = stderr || stdout || error.message;
                    reject(new Error(details));
                    return;
                }
                resolve();
            }
        );
    })
        .then(() => {
            if (reportSuccess) {
                void vscode.window.showInformationMessage(`db2ai: generated tools for ${path.basename(sourcePath)}.`);
            }
        })
        .catch(error => {
            const message = error instanceof Error ? error.message.trim() : String(error);
            void vscode.window.showErrorMessage(`db2ai: generate failed for ${path.basename(sourcePath)}: ${message}`);
        });
}

function resolveCliSpawn(context: vscode.ExtensionContext): CliSpawn | undefined {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
        const monorepoNested = path.resolve(workspaceFolder, 'packages', 'cli', 'bin', 'cli.js');
        if (existsSync(monorepoNested)) {
            return { scriptPath: monorepoNested };
        }
        const parentPackages = path.resolve(workspaceFolder, '..', 'packages', 'cli', 'bin', 'cli.js');
        if (existsSync(parentPackages)) {
            return { scriptPath: parentPackages };
        }
    }

    const bundledCliPath = context.asAbsolutePath(path.join('out', 'embed-db2ai', 'cli.cjs'));
    if (existsSync(bundledCliPath)) {
        return {
            scriptPath: bundledCliPath,
            embedHome: context.asAbsolutePath(path.join('out', 'embed-db2ai'))
        };
    }

    const extensionRelativeCandidate = path.resolve(context.extensionPath, '..', 'cli', 'bin', 'cli.js');
    if (existsSync(extensionRelativeCandidate)) {
        return { scriptPath: extensionRelativeCandidate };
    }
    return undefined;
}
