import type { LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node.js';
import * as vscode from 'vscode';
import { DiagnosticSeverity } from 'vscode';
import * as path from 'node:path';
import { cpSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';

let client: LanguageClient;
const generateByFileQueue = new Map<string, Promise<void>>();
const DIAGNOSTICS_WAIT_MS = 1500;

function waitForLanguageDiagnostics(uri: vscode.Uri): Promise<void> {
    return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
            if (settled) {
                return;
            }
            settled = true;
            dispose.dispose();
            clearTimeout(timer);
            resolve();
        };
        const dispose = vscode.languages.onDidChangeDiagnostics((event) => {
            if (event.uris.some((changedUri) => changedUri.toString() === uri.toString())) {
                finish();
            }
        });
        const timer = setTimeout(finish, DIAGNOSTICS_WAIT_MS);
    });
}

function isValidationBlockedGenerateFailure(message: string): boolean {
    return (
        /Cannot generate/i.test(message) ||
        /validation error/i.test(message) ||
        /There are validation errors/i.test(message) ||
        /fix parser errors/i.test(message)
    );
}

function reportGenerateFailure(
    productLabel: 'api2ai' | 'db2ai',
    sourcePath: string,
    message: string,
    reportSuccess: boolean
): void {
    const baseName = path.basename(sourcePath);
    if (isValidationBlockedGenerateFailure(message)) {
        if (reportSuccess) {
            void vscode.window.showWarningMessage(
                `${productLabel}: generation skipped — fix validation errors in ${baseName} first.`
            );
        }
        return;
    }
    if (reportSuccess) {
        void vscode.window.showErrorMessage(`${productLabel}: generate failed for ${baseName}: ${message}`);
    }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    client = await startLanguageClient(context);
    registerGenerateOnSave(context);
    registerGenerateCommand(context);
    registerCreateDemoWorkspaceCommand(context);
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

    const languageClient = new LanguageClient('db-2-ai-dsl', 'db2ai-dsl', serverOptions, clientOptions);

    await languageClient.start();
    return languageClient;
}

function registerGenerateOnSave(context: vscode.ExtensionContext): void {
    const disposable = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId !== 'db-2-ai-dsl') {
            return;
        }
        const sourcePath = document.uri.fsPath;
        const queued = generateByFileQueue.get(sourcePath) ?? Promise.resolve();
        const next = queued
            .catch(() => undefined)
            .then(async () => {
                await waitForLanguageDiagnostics(vscode.Uri.file(sourcePath));
                await generateForSourceFile(context, sourcePath);
            })
            .finally(() => {
                if (generateByFileQueue.get(sourcePath) === next) {
                    generateByFileQueue.delete(sourcePath);
                }
            });
        generateByFileQueue.set(sourcePath, next);
    });
    context.subscriptions.push(disposable);
}

const DEMO_COPY_SKIP_DIRS = new Set(['node_modules', 'generated', 'tmp', '.pagila-src']);
const DEMO_COPY_SKIP_FILES = new Set(['package-lock.json', '.env', '.env.local']);

function registerCreateDemoWorkspaceCommand(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand('db2ai.createDemoWorkspace', async () => {
        const targetUri = await pickDemoWorkspaceTarget();
        if (!targetUri) {
            return;
        }
        const targetDir = targetUri.fsPath;
        if (existsSync(path.join(targetDir, 'package.json'))) {
            const overwrite = await vscode.window.showWarningMessage(
                'db2ai: Target folder already contains package.json. Overwrite demo files?',
                { modal: true },
                'Overwrite'
            );
            if (overwrite !== 'Overwrite') {
                return;
            }
        }
        const sourceDir = context.asAbsolutePath('demos');
        if (!existsSync(sourceDir)) {
            void vscode.window.showErrorMessage(
                'db2ai: Bundled demos folder missing. Reinstall the extension or rebuild the VSIX.'
            );
            return;
        }
        try {
            cpSync(sourceDir, targetDir, {
                recursive: true,
                filter: (src) => shouldCopyDemoPath(sourceDir, src)
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            void vscode.window.showErrorMessage(`db2ai: Failed to create demo workspace: ${message}`);
            return;
        }
        const openFolder = 'Open folder';
        const choice = await vscode.window.showInformationMessage(
            `db2ai: Demo workspace created in ${targetDir}. Run npm install, npm run db:up, copy .env.example to .env, then npm run generate:pagila (or save pagila.db2ai).`,
            openFolder
        );
        if (choice === openFolder) {
            await vscode.commands.executeCommand('vscode.openFolder', targetUri, { forceNewWindow: false });
        }
    });
    context.subscriptions.push(disposable);
}

async function pickDemoWorkspaceTarget(): Promise<vscode.Uri | undefined> {
    const picked = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Create demo workspace here'
    });
    if (picked?.[0]) {
        return picked[0];
    }
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (folder && !existsSync(path.join(folder.uri.fsPath, 'package.json'))) {
        const useWorkspace = await vscode.window.showQuickPick([{ label: 'Use current workspace folder', folder }], {
            placeHolder: 'No folder selected — use open workspace?'
        });
        if (useWorkspace) {
            return useWorkspace.folder.uri;
        }
    }
    return undefined;
}

function shouldCopyDemoPath(sourceDir: string, src: string): boolean {
    const relative = path.relative(sourceDir, src);
    if (!relative || relative === '') {
        return true;
    }
    const parts = relative.split(path.sep);
    if (parts.some((part) => DEMO_COPY_SKIP_DIRS.has(part))) {
        return false;
    }
    const base = parts[parts.length - 1];
    if (base && DEMO_COPY_SKIP_FILES.has(base)) {
        return false;
    }
    return true;
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
    const sourceUri = vscode.Uri.file(sourcePath);
    const blockingErrors = vscode.languages
        .getDiagnostics(sourceUri)
        .filter((diagnostic) => diagnostic.severity === DiagnosticSeverity.Error);
    if (blockingErrors.length > 0) {
        if (reportSuccess) {
            void vscode.window.showWarningMessage(
                `db2ai: generation skipped — fix ${blockingErrors.length} error(s) in ${path.basename(sourcePath)} first.`
            );
        }
        return;
    }

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
        .catch((error) => {
            const message = error instanceof Error ? error.message.trim() : String(error);
            reportGenerateFailure('db2ai', sourcePath, message, reportSuccess);
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
        const demosMonorepoCli = path.resolve(workspaceFolder, '../../cli/bin/cli.js');
        if (existsSync(demosMonorepoCli)) {
            return { scriptPath: demosMonorepoCli };
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
