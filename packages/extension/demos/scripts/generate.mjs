#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveEmbedHome(cliPath) {
    const parent = path.dirname(cliPath);
    if (path.basename(parent) === 'embed-db2ai') {
        return parent;
    }
    return undefined;
}

function findInstalledExtensionCli() {
    const home = os.homedir();
    const roots = [
        path.join(home, '.cursor', 'extensions'),
        path.join(home, '.vscode', 'extensions'),
        path.join(home, '.vscode-insiders', 'extensions')
    ];
    const candidates = [];
    for (const root of roots) {
        if (!existsSync(root)) {
            continue;
        }
        for (const entry of readdirSync(root, { withFileTypes: true })) {
            if (!entry.isDirectory()) {
                continue;
            }
            if (!entry.name.startsWith('db2ai.vscode-db2ai-')) {
                continue;
            }
            candidates.push(path.join(root, entry.name, 'out', 'embed-db2ai', 'cli.cjs'));
        }
    }
    candidates.sort();
    return candidates.filter((candidate) => existsSync(candidate)).at(-1);
}

function resolveCliSpawn() {
    const envCli = process.env.DB2AI_CLI;
    if (envCli && existsSync(envCli)) {
        return { scriptPath: envCli, embedHome: resolveEmbedHome(envCli) };
    }

    const monorepoCli = path.resolve(workspaceRoot, '../../cli/bin/cli.js');
    if (existsSync(monorepoCli)) {
        return { scriptPath: monorepoCli };
    }

    const installedCli = findInstalledExtensionCli();
    if (installedCli) {
        return {
            scriptPath: installedCli,
            embedHome: resolveEmbedHome(installedCli)
        };
    }

    throw new Error(
        [
            'db2ai CLI not found.',
            '• Install the db2ai VS Code/Cursor extension (VSIX), or',
            '• Run from the db2ai monorepo with packages/extension/demos as cwd, or',
            '• Set DB2AI_CLI to cli.js / cli.cjs.'
        ].join('\n')
    );
}

const [dslRelative, outRelative] = process.argv.slice(2);
if (!dslRelative || !outRelative) {
    console.error('Usage: node scripts/generate.mjs <file.db2ai> <generated/tools/out.ts>');
    process.exit(1);
}

const { scriptPath, embedHome } = resolveCliSpawn();
const dslPath = path.join(workspaceRoot, dslRelative);
const outPath = path.join(workspaceRoot, outRelative);
const env = embedHome ? { ...process.env, DB2AI_EMBED_HOME: embedHome } : process.env;

execFileSync(process.execPath, [scriptPath, 'generate', dslPath, outPath], {
    stdio: 'inherit',
    cwd: workspaceRoot,
    env
});
