#!/usr/bin/env node
/**
 * Generated MCP stdio host (static runtime — no @core2ai/core).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
const LOCAL_ENV_FILES = ['.env', '.env.local'];
function stripOptionalQuotes(value) {
    if (value.length < 2) {
        return value;
    }
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        return value.slice(1, -1);
    }
    return value;
}
function parseEnvLine(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
        return undefined;
    }
    const assignment = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed;
    const separator = assignment.indexOf('=');
    if (separator <= 0) {
        return undefined;
    }
    const key = assignment.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        return undefined;
    }
    const value = stripOptionalQuotes(assignment.slice(separator + 1).trim());
    return [key, value];
}
function ancestorDirectories(startDir) {
    const directories = [];
    let current = path.resolve(startDir);
    while (true) {
        directories.unshift(current);
        const parent = path.dirname(current);
        if (parent === current) {
            break;
        }
        current = parent;
    }
    return directories;
}
function loadLocalEnvFiles(startDirs, options) {
    const refresh = options?.refresh === true;
    const protectedKeys = refresh ? new Set() : new Set(Object.keys(process.env));
    const loadedKeys = new Set();
    const loadedFiles = [];
    const visitedFiles = new Set();
    for (const startDir of startDirs) {
        for (const directory of ancestorDirectories(startDir)) {
            for (const fileName of LOCAL_ENV_FILES) {
                const filePath = path.join(directory, fileName);
                if (visitedFiles.has(filePath) || !fs.existsSync(filePath)) {
                    continue;
                }
                visitedFiles.add(filePath);
                const content = fs.readFileSync(filePath, 'utf-8');
                const overrideExisting = fileName === '.env.local';
                for (const line of content.split(/\r?\n/u)) {
                    const parsed = parseEnvLine(line);
                    if (!parsed) {
                        continue;
                    }
                    const [key, value] = parsed;
                    if (overrideExisting || !protectedKeys.has(key) || loadedKeys.has(key)) {
                        process.env[key] = value;
                        loadedKeys.add(key);
                    }
                }
                loadedFiles.push(filePath);
            }
        }
    }
    return loadedFiles;
}
function readMcpHostAdapter(imported) {
    const adapter = imported.mcpHostAdapter;
    if (!adapter || typeof adapter !== 'object') {
        throw new Error('Generated module must export "mcpHostAdapter". Regenerate tool code.');
    }
    const a = adapter;
    if (typeof a.configureFromArgv !== 'function') {
        throw new Error('mcpHostAdapter.configureFromArgv is required. Regenerate tool code.');
    }
    if (typeof a.validateAtStartup !== 'function') {
        throw new Error('mcpHostAdapter.validateAtStartup is required. Regenerate tool code.');
    }
    if (typeof a.resolveHostContext !== 'function') {
        throw new Error('mcpHostAdapter.resolveHostContext is required. Regenerate tool code.');
    }
    if (typeof a.envDirsForReload !== 'function') {
        throw new Error('mcpHostAdapter.envDirsForReload is required. Regenerate tool code.');
    }
    return a;
}
function readGeneratedModule(imported) {
    const generatedTools = imported.generatedTools;
    const invokeTool = imported.invokeTool;
    if (!Array.isArray(generatedTools)) {
        throw new Error('Generated module must export "generatedTools" array.');
    }
    if (typeof invokeTool !== 'function') {
        throw new Error('Generated module must export async "invokeTool" function.');
    }
    const inputZodByTool = imported.inputZodByTool;
    const mcpServerName = imported.mcpServerName;
    const mcpServerVersion = imported.mcpServerVersion;
    return {
        adapter: readMcpHostAdapter(imported),
        generatedTools: generatedTools,
        invokeTool: invokeTool,
        inputZodByTool: inputZodByTool && typeof inputZodByTool === 'object' && !Array.isArray(inputZodByTool)
            ? inputZodByTool
            : undefined,
        mcpServerName: typeof mcpServerName === 'string' ? mcpServerName : undefined,
        mcpServerVersion: typeof mcpServerVersion === 'string' ? mcpServerVersion : undefined,
        requiresAuth: imported.requiresAuth === true
    };
}
function requireMcpServerIdentity(generated) {
    const name = generated.mcpServerName?.trim();
    const version = generated.mcpServerVersion?.trim();
    if (!name) {
        throw new Error('Generated module must export "mcpServerName". Regenerate tool code.');
    }
    if (!version) {
        throw new Error('Generated module must export "mcpServerVersion". Regenerate tool code.');
    }
    return { name, version };
}
function requireInputZodSchema(inputZodByTool, toolName) {
    if (!inputZodByTool) {
        throw new Error('Generated module must export "inputZodByTool". Regenerate tool code.');
    }
    const schema = inputZodByTool[toolName];
    if (!schema || typeof schema !== 'object') {
        throw new Error(`Generated module inputZodByTool has no schema for tool "${toolName}". Regenerate tool code.`);
    }
    return schema;
}
function reloadEnvFilesForDev(generated) {
    const dirs = generated.adapter.envDirsForReload();
    if (dirs.length > 0) {
        loadLocalEnvFiles(dirs, { refresh: true });
    }
}
async function runMcpServer(generated) {
    const { name, version } = requireMcpServerIdentity(generated);
    const server = new McpServer({ name, version });
    for (const tool of generated.generatedTools) {
        const inputSchema = requireInputZodSchema(generated.inputZodByTool, tool.toolName);
        server.registerTool(tool.toolName, {
            title: typeof tool.title === 'string' && tool.title.length > 0 ? tool.title : undefined,
            description: tool.description,
            inputSchema
        }, async (args) => {
            reloadEnvFilesForDev(generated);
            const hostContext = generated.adapter.resolveHostContext();
            const result = await generated.invokeTool(tool.toolName, (args ?? {}), hostContext);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        });
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
async function runMcpStandaloneFromArgv(argv) {
    const modulePath = argv[0];
    if (!modulePath) {
        throw new Error('Usage: node mcp-serve.js <path-to-*-tools.js> [host options...]');
    }
    const envDirs = [process.cwd(), path.dirname(path.resolve(modulePath))];
    loadLocalEnvFiles(envDirs);
    const imported = await import(pathToFileURL(path.resolve(modulePath)).href);
    if (!imported || typeof imported !== 'object') {
        throw new Error(`Generated module "${modulePath}" did not export an object.`);
    }
    const generated = readGeneratedModule(imported);
    generated.adapter.configureFromArgv(argv.slice(1), envDirs);
    generated.adapter.validateAtStartup(generated.requiresAuth === true);
    console.error('[mcp] host context refreshed each tool call');
    await runMcpServer(generated);
}
await runMcpStandaloneFromArgv(process.argv.slice(2));
