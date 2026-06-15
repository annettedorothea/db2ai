#!/usr/bin/env node
/**
 * Run CLI generate for one DSL file (VSIX embed or env override).
 *
 * Usage: node ./scripts/generate.mjs <file.dsl> <generated/tools/out.ts>
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(projectRoot, 'project-generate.config.json');

function loadConfig() {
    const raw = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    const required = [
        'productName',
        'extensionIdPrefix',
        'embedDirName',
        'cliEnvVar',
        'embedHomeEnvVar',
        'dslExtension'
    ];
    for (const key of required) {
        if (typeof config[key] !== 'string' || config[key].trim().length === 0) {
            throw new Error(`[generate] ${path.basename(configPath)} missing "${key}"`);
        }
    }
    return config;
}

function resolveEmbedHome(cliPath, embedDirName) {
    const parent = path.dirname(cliPath);
    if (path.basename(parent) === embedDirName) {
        return parent;
    }
    return undefined;
}

function findMonorepoEmbedCli(config) {
    const candidate = path.join(projectRoot, '..', 'out', config.embedDirName, 'cli.cjs');
    return existsSync(candidate) ? candidate : undefined;
}

function findInstalledExtensionCli(config) {
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
            if (!entry.isDirectory() || !entry.name.startsWith(config.extensionIdPrefix)) {
                continue;
            }
            candidates.push(path.join(root, entry.name, 'out', config.embedDirName, 'cli.cjs'));
        }
    }
    candidates.sort();
    return candidates.filter((candidate) => existsSync(candidate)).at(-1);
}

function resolveCliSpawn(config) {
    const envCli = process.env[config.cliEnvVar];
    if (envCli && existsSync(envCli)) {
        return { scriptPath: envCli, embedHome: resolveEmbedHome(envCli, config.embedDirName) };
    }

    const monorepoCli = findMonorepoEmbedCli(config);
    if (monorepoCli) {
        return {
            scriptPath: monorepoCli,
            embedHome: resolveEmbedHome(monorepoCli, config.embedDirName)
        };
    }

    const installedCli = findInstalledExtensionCli(config);
    if (installedCli) {
        return {
            scriptPath: installedCli,
            embedHome: resolveEmbedHome(installedCli, config.embedDirName)
        };
    }

    throw new Error(
        [
            `${config.productName} CLI not found.`,
            '• Run npm run build in the ' + config.productName + ' repo (embed under packages/extension/out), or',
            `• Install the ${config.productName} VS Code/Cursor extension (VSIX), or`,
            `• Set ${config.cliEnvVar} to cli.cjs from the extension embed folder.`
        ].join('\n')
    );
}

function main() {
    const dslRelative = process.argv[2];
    const outRelative = process.argv[3];
    const config = loadConfig();

    if (!dslRelative || !outRelative) {
        console.error(
            `Usage: node ./scripts/generate.mjs <file${config.dslExtension}> <generated/tools/out.ts>`
        );
        process.exit(1);
    }

    const { scriptPath, embedHome } = resolveCliSpawn(config);
    const dslPath = path.isAbsolute(dslRelative) ? dslRelative : path.join(projectRoot, dslRelative);
    const outPath = path.isAbsolute(outRelative) ? outRelative : path.join(projectRoot, outRelative);
    const generateCwd = path.isAbsolute(dslRelative) ? path.dirname(dslPath) : projectRoot;
    const env = embedHome ? { ...process.env, [config.embedHomeEnvVar]: embedHome } : process.env;

    execFileSync(process.execPath, [scriptPath, 'generate', dslPath, outPath], {
        stdio: 'inherit',
        cwd: generateCwd,
        env
    });
}

main();
