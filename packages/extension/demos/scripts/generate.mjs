#!/usr/bin/env node
/**
 * Run CLI generate for one DSL file (project-generate.config.json cliPath or env override).
 *
 * Usage: node ./scripts/generate.mjs <file.dsl> <generated/{product}/tools/out.ts>
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(projectRoot, 'project-generate.config.json');

function loadConfig() {
    const raw = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    const required = ['productName', 'embedDirName', 'cliEnvVar', 'embedHomeEnvVar', 'dslExtension', 'cliPath'];
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

function resolveConfigCliPath(cliPath) {
    return path.isAbsolute(cliPath) ? cliPath : path.resolve(projectRoot, cliPath);
}

function resolveCliSpawn(config) {
    const envCli = process.env[config.cliEnvVar];
    if (envCli && existsSync(envCli)) {
        return { scriptPath: envCli, embedHome: resolveEmbedHome(envCli, config.embedDirName) };
    }

    const scriptPath = resolveConfigCliPath(config.cliPath);
    if (!existsSync(scriptPath)) {
        throw new Error(
            [
                `${config.productName} CLI not found at ${scriptPath}.`,
                `Set ${config.cliEnvVar} or update cliPath in ${path.basename(configPath)}.`,
                'Demo workspace: use Create Demo Workspace from the extension, or point cliPath at …/out/embed-…/cli.cjs.'
            ].join('\n')
        );
    }

    return {
        scriptPath,
        embedHome: resolveEmbedHome(scriptPath, config.embedDirName)
    };
}

function main() {
    const dslRelative = process.argv[2];
    const outRelative = process.argv[3];
    const config = loadConfig();

    if (!dslRelative || !outRelative) {
        console.error(
            `Usage: node ./scripts/generate.mjs <file${config.dslExtension}> <generated/${config.productName}/tools/out.ts>`
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
