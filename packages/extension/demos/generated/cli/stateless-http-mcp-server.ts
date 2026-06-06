#!/usr/bin/env node
/**
 * Generated stateless MCP Streamable HTTP host (static runtime — no @core2ai/core).
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, type ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';
import { loggingAdapter } from '../../src/utils/logging-adapter.js';

const LOCAL_ENV_FILES = ['.env', '.env.local'];

type DatabaseDialect = 'postgres' | 'mysql';

type ApiLikeHostContext = {
    baseUrl?: string;
    connectionString?: string;
    databaseDialect?: DatabaseDialect;
    credential?: string;
    jwt?: Record<string, unknown>;
};

type GeneratedHostModule = {
    generatedTools: Array<{ toolName: string; title?: string; description: string; access?: string }>;
    invokeTool: (toolName: string, args?: Record<string, unknown>, hostContext?: unknown) => Promise<unknown>;
    inputZodByTool?: Record<string, unknown>;
    mcpServerName?: string;
    mcpServerVersion?: string;
    requiresAuth: boolean;
    connectionEnv?: string;
    databaseDialect?: DatabaseDialect;
};

function stripOptionalQuotes(value: string): string {
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

function parseEnvLine(line: string): [string, string] | undefined {
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

function ancestorDirectories(startDir: string): string[] {
    const directories: string[] = [];
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

function loadLocalEnvFiles(startDirs: string[], options?: { refresh?: boolean }): string[] {
    const refresh = options?.refresh === true;
    const protectedKeys = refresh ? new Set<string>() : new Set(Object.keys(process.env));
    const loadedKeys = new Set<string>();
    const loadedFiles: string[] = [];
    const visitedFiles = new Set<string>();
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

function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> {
    const parts = String(token).trim().split('.');
    if (parts.length !== 3) {
        throw new Error('credential is not a JWT (expected three dot-separated segments).');
    }
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
        b64 += '=';
    }
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as Record<string, unknown>;
}

function credentialWithOptionalJwt(credential: string | undefined): {
    credential?: string;
    jwt?: Record<string, unknown>;
} {
    if (!credential?.trim()) {
        return {};
    }
    const trimmed = credential.trim();
    const segments = trimmed.split('.');
    if (segments.length !== 3) {
        return { credential: trimmed };
    }
    try {
        return { credential: trimmed, jwt: decodeJwtPayloadUnsafe(trimmed) };
    } catch {
        return { credential: trimmed };
    }
}

function parseDatabaseDialect(value: unknown): DatabaseDialect | undefined {
    return value === 'postgres' || value === 'mysql' ? value : undefined;
}

function isExpectedDatabaseUrl(connectionString: string, dialect: DatabaseDialect): boolean {
    if (dialect === 'mysql') {
        return connectionString.startsWith('mysql://');
    }
    return connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://');
}

type HostCredentialValidationMode = 'hs256' | 'static' | 'opaque' | 'oidc';

type CredentialValidationFields = {
    credentialValidation?: HostCredentialValidationMode;
    jwtSecretEnvKey?: string;
    authExpectedEnvKey?: string;
};

function parseHostCredentialValidationMode(raw: string | undefined): HostCredentialValidationMode {
    if (raw === 'hs256' || raw === 'static' || raw === 'opaque' || raw === 'oidc') {
        return raw;
    }
    throw new Error('Invalid credential validation mode (expected hs256|static|opaque|oidc): ' + String(raw));
}

function readJwtSecretFromEnv(jwtSecretEnvKey: string): string {
    const value = process.env[jwtSecretEnvKey]?.trim();
    if (!value) {
        throw new Error('Environment variable "' + jwtSecretEnvKey + '" is missing or empty.');
    }
    return value;
}

function verifyAccessTokenJwt(
    token: string,
    secret: string
): { ok: true; payload: Record<string, unknown> } | { ok: false } {
    const parts = token.split('.');
    if (parts.length !== 3) {
        return { ok: false };
    }
    const [headerSeg, payloadSeg, sigSeg] = parts;
    const signingInput = headerSeg + '.' + payloadSeg;
    const expected = crypto.createHmac('sha256', secret).update(signingInput).digest();
    let actual: Buffer;
    try {
        let b64 = sigSeg.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) {
            b64 += '=';
        }
        actual = Buffer.from(b64, 'base64');
    } catch {
        return { ok: false };
    }
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
        return { ok: false };
    }
    try {
        let b64 = payloadSeg.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) {
            b64 += '=';
        }
        const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as Record<string, unknown>;
        const now = Math.floor(Date.now() / 1000);
        if (typeof payload.exp === 'number' && payload.exp < now) {
            return { ok: false };
        }
        return { ok: true, payload };
    } catch {
        return { ok: false };
    }
}

function timingSafeEqualStrings(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) {
        return false;
    }
    return crypto.timingSafeEqual(aBuf, bBuf);
}

function generatedHasCheckedTool(generated: GeneratedHostModule): boolean {
    return generated.generatedTools.some((t) => t.access === 'checked');
}

function warnCredentialValidationModeAtStartup(
    generated: GeneratedHostModule,
    mode: HostCredentialValidationMode
): void {
    if (mode === 'opaque' && generated.connectionEnv) {
        loggingAdapter.warn(
            '[mcp] opaque credential validation on db2ai — host is the only auth layer; prefer static or hs256 in production.'
        );
    }
    if (mode === 'opaque' && generatedHasCheckedTool(generated)) {
        loggingAdapter.warn(
            '[mcp] opaque mode with checked tools — JWT claims in src/auth are not cryptographically verified.'
        );
    }
}

function validateStdioOrHttpCredentialValidationAtStartup(
    generated: GeneratedHostModule,
    fields: CredentialValidationFields
): void {
    if (!generated.requiresAuth) {
        return;
    }
    if (!fields.credentialValidation) {
        throw new Error(
            'Generated tools require auth; pass --credential-validation <hs256|static|opaque> on the MCP host.'
        );
    }
    const mode = fields.credentialValidation;
    if (mode === 'oidc') {
        throw new Error(
            'credential validation mode "oidc" is not supported on stdio or stateless HTTP — use OAuth HTTP host.'
        );
    }
    if (mode === 'static') {
        const expectedKey = fields.authExpectedEnvKey?.trim();
        if (!expectedKey) {
            throw new Error('Required for static validation: --auth-expected-env <ENV_VAR_NAME>');
        }
        const expected = process.env[expectedKey]?.trim();
        if (!expected) {
            throw new Error(
                'Environment variable "' + expectedKey + '" is missing or empty (required by --auth-expected-env).'
            );
        }
    }
    if (mode === 'hs256') {
        const secretKey = fields.jwtSecretEnvKey?.trim();
        if (!secretKey) {
            throw new Error('Required for hs256 validation: --jwt-secret-env <ENV_VAR_NAME>');
        }
        readJwtSecretFromEnv(secretKey);
    }
    warnCredentialValidationModeAtStartup(generated, mode);
}

async function verifyHostCredential(
    credential: string,
    fields: CredentialValidationFields
): Promise<{ ok: true; payload?: Record<string, unknown> } | { ok: false }> {
    const trimmed = credential.trim();
    if (!trimmed) {
        return { ok: false };
    }
    const mode = fields.credentialValidation ?? 'opaque';
    if (mode === 'opaque') {
        return { ok: true };
    }
    if (mode === 'static') {
        const expectedKey = fields.authExpectedEnvKey?.trim();
        if (!expectedKey) {
            return { ok: false };
        }
        const expected = process.env[expectedKey]?.trim();
        if (!expected) {
            return { ok: false };
        }
        return timingSafeEqualStrings(trimmed, expected) ? { ok: true } : { ok: false };
    }
    if (mode === 'hs256') {
        const secretKey = fields.jwtSecretEnvKey?.trim();
        if (!secretKey) {
            return { ok: false };
        }
        const secret = readJwtSecretFromEnv(secretKey);
        return verifyAccessTokenJwt(trimmed, secret);
    }
    return { ok: false };
}

async function resolveVerifiedHostCredential(
    rawCredential: string | undefined,
    generated: GeneratedHostModule,
    fields: CredentialValidationFields
): Promise<{ credential?: string; jwt?: Record<string, unknown> }> {
    if (!rawCredential?.trim()) {
        return {};
    }
    if (!generated.requiresAuth || !fields.credentialValidation) {
        return credentialWithOptionalJwt(rawCredential);
    }
    const verified = await verifyHostCredential(rawCredential, fields);
    if (!verified.ok) {
        throw new Error('Invalid host credential (failed ' + fields.credentialValidation + ' validation).');
    }
    const trimmed = rawCredential.trim();
    if (verified.payload) {
        return { credential: trimmed, jwt: verified.payload };
    }
    return credentialWithOptionalJwt(trimmed);
}

function parseCredentialValidationArgvFlags(
    argv: string[],
    index: number
): {
    nextIndex: number;
    credentialValidation?: HostCredentialValidationMode;
    jwtSecretEnvKey?: string;
    authExpectedEnvKey?: string;
} {
    const arg = argv[index];
    if (arg === '--credential-validation') {
        const raw = argv[index + 1];
        if (!raw) {
            throw new Error('Missing value after --credential-validation');
        }
        return {
            nextIndex: index + 2,
            credentialValidation: parseHostCredentialValidationMode(raw)
        };
    }
    if (arg === '--jwt-secret-env') {
        const raw = argv[index + 1];
        if (!raw) {
            throw new Error('Missing value after --jwt-secret-env');
        }
        return { nextIndex: index + 2, jwtSecretEnvKey: raw };
    }
    if (arg === '--auth-expected-env') {
        const raw = argv[index + 1];
        if (!raw) {
            throw new Error('Missing value after --auth-expected-env');
        }
        return { nextIndex: index + 2, authExpectedEnvKey: raw };
    }
    return { nextIndex: index };
}

function formatToolError(err: unknown): string {
    if (err instanceof Error) {
        return err.message;
    }
    return String(err);
}

function readGeneratedModule(imported: Record<string, unknown>): GeneratedHostModule {
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
    const connectionEnv = imported.connectionEnv;
    return {
        generatedTools: generatedTools as Array<{ toolName: string; title?: string; description: string }>,
        invokeTool: invokeTool as (
            toolName: string,
            args?: Record<string, unknown>,
            hostContext?: unknown
        ) => Promise<unknown>,
        inputZodByTool:
            inputZodByTool && typeof inputZodByTool === 'object' && !Array.isArray(inputZodByTool)
                ? (inputZodByTool as Record<string, unknown>)
                : undefined,
        mcpServerName: typeof mcpServerName === 'string' ? mcpServerName : undefined,
        mcpServerVersion: typeof mcpServerVersion === 'string' ? mcpServerVersion : undefined,
        requiresAuth: imported.requiresAuth === true,
        connectionEnv: typeof connectionEnv === 'string' ? connectionEnv : undefined,
        databaseDialect: parseDatabaseDialect(imported.databaseDialect)
    };
}

function requireMcpServerIdentity(generated: GeneratedHostModule): { name: string; version: string } {
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

function requireInputZodSchema(inputZodByTool: Record<string, unknown> | undefined, toolName: string): z.ZodTypeAny {
    if (!inputZodByTool) {
        throw new Error('Generated module must export "inputZodByTool". Regenerate tool code.');
    }
    const schema = inputZodByTool[toolName];
    if (!schema || typeof schema !== 'object') {
        throw new Error(`Generated module inputZodByTool has no schema for tool "${toolName}". Regenerate tool code.`);
    }
    return schema as z.ZodTypeAny;
}

/** Log when the MCP client requests tools/list (wraps SDK handler set by registerTool). */
function attachListToolsDebugLogging(mcpServer: McpServer, generated: GeneratedHostModule): void {
    type ListToolsHandler = (request: unknown, extra: unknown) => Promise<ListToolsResult>;
    const handlers = (mcpServer.server as unknown as { _requestHandlers: Map<string, ListToolsHandler> })
        ._requestHandlers;
    const previous = handlers.get('tools/list');
    if (!previous) {
        return;
    }
    mcpServer.server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
        loggingAdapter.debug('listTools', {
            toolCount: generated.generatedTools.length,
            toolNames: generated.generatedTools.map((t) => t.toolName)
        });
        return previous(request, extra);
    });
}

async function registerMcpTools(
    server: McpServer,
    generated: GeneratedHostModule,
    options: { envDirs: string[]; resolveContext: () => ApiLikeHostContext | Promise<ApiLikeHostContext> }
): Promise<void> {
    for (const tool of generated.generatedTools) {
        const inputSchema = requireInputZodSchema(generated.inputZodByTool, tool.toolName);
        server.registerTool(
            tool.toolName,
            {
                title: typeof tool.title === 'string' && tool.title.length > 0 ? tool.title : undefined,
                description: tool.description,
                inputSchema
            },
            async (args) => {
                loadLocalEnvFiles(options.envDirs, { refresh: true });
                const hostContext = await Promise.resolve(options.resolveContext());
                try {
                    const result = await generated.invokeTool(
                        tool.toolName,
                        (args ?? {}) as Record<string, unknown>,
                        hostContext
                    );
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result, null, 2)
                            }
                        ]
                    };
                } catch (err) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: formatToolError(err)
                            }
                        ]
                    };
                }
            }
        );
    }
    attachListToolsDebugLogging(server, generated);
}

async function readMcpHttpJsonBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    if (chunks.length === 0) {
        return undefined;
    }
    const text = Buffer.concat(chunks).toString('utf-8');
    if (text.trim().length === 0) {
        return undefined;
    }
    return JSON.parse(text) as unknown;
}

function writeJsonRpcError(res: ServerResponse, status: number, code: number, message: string): void {
    if (res.headersSent) {
        return;
    }
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: { code, message },
            id: null
        })
    );
}

function writeJsonRpcInternalError(res: ServerResponse): void {
    writeJsonRpcError(res, 500, -32_603, 'Internal server error');
}

function writeJsonRpcMethodNotAllowed(res: ServerResponse): void {
    writeJsonRpcError(res, 405, -32_000, 'Method not allowed.');
}

type StatelessHttpHostRuntimeConfig = CredentialValidationFields & {
    baseUrlEnvKey?: string;
    envDirs: string[];
    listenHost: string;
    port: number;
    mcpPath: string;
};

const DEFAULT_MCP_AUTH_HEADER = 'x-api-token';

function parseStatelessHttpHostArgv(argv: string[], envDirs: string[]): StatelessHttpHostRuntimeConfig {
    let baseUrlEnv: string | undefined;
    let listenHost = '127.0.0.1';
    let port: number | undefined;
    let mcpPath = '/mcp';
    let credentialValidation: HostCredentialValidationMode | undefined;
    let jwtSecretEnvKey: string | undefined;
    let authExpectedEnvKey: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--base-url-env') {
            baseUrlEnv = argv[++i];
            if (!baseUrlEnv) {
                throw new Error('Missing value after --base-url-env');
            }
            continue;
        }
        if (arg === '--credential-validation' || arg === '--jwt-secret-env' || arg === '--auth-expected-env') {
            const parsed = parseCredentialValidationArgvFlags(argv, i);
            if (parsed.credentialValidation !== undefined) {
                credentialValidation = parsed.credentialValidation;
            }
            if (parsed.jwtSecretEnvKey !== undefined) {
                jwtSecretEnvKey = parsed.jwtSecretEnvKey;
            }
            if (parsed.authExpectedEnvKey !== undefined) {
                authExpectedEnvKey = parsed.authExpectedEnvKey;
            }
            i = parsed.nextIndex - 1;
            continue;
        }
        if (arg === '--host') {
            listenHost = argv[++i];
            if (!listenHost) {
                throw new Error('Missing value after --host');
            }
            continue;
        }
        if (arg === '--port') {
            const raw = argv[++i];
            if (!raw) {
                throw new Error('Missing value after --port');
            }
            port = Number.parseInt(raw, 10);
            if (!Number.isFinite(port) || port <= 0) {
                throw new Error('Invalid --port value: ' + raw);
            }
            continue;
        }
        if (arg === '--path') {
            mcpPath = argv[++i];
            if (!mcpPath) {
                throw new Error('Missing value after --path');
            }
            if (!mcpPath.startsWith('/')) {
                mcpPath = '/' + mcpPath;
            }
            continue;
        }
        if (arg.startsWith('-')) {
            throw new Error('Unknown option: ' + arg);
        }
        throw new Error('Unexpected positional argument: ' + arg);
    }
    if (port === undefined) {
        throw new Error('Required: --port <number>');
    }
    return {
        baseUrlEnvKey: baseUrlEnv,
        envDirs,
        listenHost,
        port,
        mcpPath,
        credentialValidation,
        jwtSecretEnvKey,
        authExpectedEnvKey
    };
}

function readAuthHeaderNameFromEnv(): string {
    const configured = process.env.MCP_AUTH_HEADER?.trim();
    return configured && configured.length > 0 ? configured : DEFAULT_MCP_AUTH_HEADER;
}

function readCredentialFromHttpHeaders(
    headers: Record<string, string | string[] | undefined>,
    headerName: string
): string | undefined {
    const normalized = headerName.trim().toLowerCase();
    const raw = headers[normalized];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed.length > 0 ? trimmed : undefined;
}

function validateStatelessHttpHostAtStartup(
    httpHostConfig: StatelessHttpHostRuntimeConfig,
    generated: GeneratedHostModule
): void {
    if (generated.connectionEnv) {
        const connectionString = process.env[generated.connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Environment variable "' + generated.connectionEnv + '" is missing or empty (database env from .db2ai).'
            );
        }
        const dialect: DatabaseDialect = generated.databaseDialect ?? 'postgres';
        if (!isExpectedDatabaseUrl(connectionString, dialect)) {
            throw new Error(
                'Environment variable "' +
                    generated.connectionEnv +
                    '" does not match generated database dialect "' +
                    dialect +
                    '".'
            );
        }
    } else {
        const baseUrlKey = httpHostConfig.baseUrlEnvKey?.trim();
        if (!baseUrlKey) {
            throw new Error('Required: --base-url-env <ENV_VAR_NAME>');
        }
        const baseUrl = process.env[baseUrlKey]?.trim();
        if (!baseUrl) {
            throw new Error(
                'Environment variable "' + baseUrlKey + '" is missing or empty (required by --base-url-env).'
            );
        }
    }
    validateStdioOrHttpCredentialValidationAtStartup(generated, httpHostConfig);
}

async function resolveHostContextForHttpCall(
    httpHostConfig: StatelessHttpHostRuntimeConfig,
    generated: GeneratedHostModule,
    incomingHeaders: Record<string, string | string[] | undefined>
): Promise<ApiLikeHostContext> {
    const headerName = readAuthHeaderNameFromEnv();
    const credential = readCredentialFromHttpHeaders(incomingHeaders, headerName);
    const { credential: c, jwt } = await resolveVerifiedHostCredential(credential, generated, httpHostConfig);
    if (generated.connectionEnv) {
        const connectionString = process.env[generated.connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Missing database URL. Set environment variable "' + generated.connectionEnv + '" (from .db2ai).'
            );
        }
        const dialect: DatabaseDialect = generated.databaseDialect ?? 'postgres';
        if (!isExpectedDatabaseUrl(connectionString, dialect)) {
            throw new Error(
                'Database URL from "' + generated.connectionEnv + '" does not match dialect "' + dialect + '".'
            );
        }
        return { connectionString, databaseDialect: dialect, credential: c, jwt };
    }
    const baseUrlKey = httpHostConfig.baseUrlEnvKey?.trim();
    const baseUrl = baseUrlKey ? process.env[baseUrlKey]?.trim() : undefined;
    if (!baseUrl) {
        throw new Error(
            'Missing host base URL. Pass --base-url-env on stateless-http-mcp-server.js and set the variable.'
        );
    }
    return { baseUrl, credential: c, jwt };
}

async function handleStatelessMcpPost(
    req: IncomingMessage,
    res: ServerResponse,
    generated: GeneratedHostModule,
    httpHostConfig: StatelessHttpHostRuntimeConfig
): Promise<void> {
    const incomingHeaders = req.headers as Record<string, string | string[] | undefined>;
    const { name, version } = requireMcpServerIdentity(generated);
    const server = new McpServer({ name, version });
    await registerMcpTools(server, generated, {
        envDirs: httpHostConfig.envDirs,
        resolveContext: () => resolveHostContextForHttpCall(httpHostConfig, generated, incomingHeaders)
    });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    try {
        await server.connect(transport);
        const parsedBody = await readMcpHttpJsonBody(req);
        res.on('close', () => {
            void transport.close();
            void server.close();
        });
        await transport.handleRequest(req, res, parsedBody);
    } catch (err) {
        console.error('[mcp] stateless HTTP request failed:', err);
        if (!res.headersSent) {
            writeJsonRpcInternalError(res);
        }
    }
}

async function runStatelessHttpMcpStandaloneFromArgv(argv: string[]): Promise<void> {
    const modulePath = argv[0];
    if (!modulePath) {
        throw new Error(
            'Usage: node stateless-http-mcp-server.js <path-to-*-tools.js> [--base-url-env ENV] --port N [--host HOST] [--path /mcp]'
        );
    }
    const envDirs = [process.cwd(), path.dirname(path.resolve(modulePath))];
    loadLocalEnvFiles(envDirs);
    const imported = await import(pathToFileURL(path.resolve(modulePath)).href);
    if (!imported || typeof imported !== 'object') {
        throw new Error(`Generated module "${modulePath}" did not export an object.`);
    }
    const generated = readGeneratedModule(imported as Record<string, unknown>);
    const httpHostConfig = parseStatelessHttpHostArgv(argv.slice(1), envDirs);
    if (!generated.connectionEnv && !httpHostConfig.baseUrlEnvKey) {
        throw new Error(
            'Required: --base-url-env <ENV_VAR_NAME> for HTTP/OpenAPI tools, or export connectionEnv from a .db2ai module.'
        );
    }
    validateStatelessHttpHostAtStartup(httpHostConfig, generated);
    const authHeaderName = readAuthHeaderNameFromEnv();
    loggingAdapter.info('[mcp] stateless HTTP listening', {
        url: 'http://' + httpHostConfig.listenHost + ':' + httpHostConfig.port + httpHostConfig.mcpPath,
        credentialHeader: authHeaderName
    });

    const httpServer = http.createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://' + (req.headers.host ?? 'localhost'));
        if (url.pathname !== httpHostConfig.mcpPath) {
            res.writeHead(404).end('Not found');
            return;
        }
        if (req.method === 'POST') {
            await handleStatelessMcpPost(req, res, generated, httpHostConfig);
            return;
        }
        if (req.method === 'GET' || req.method === 'DELETE') {
            writeJsonRpcMethodNotAllowed(res);
            return;
        }
        res.writeHead(405).end('Method not allowed');
    });

    await new Promise<void>((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.listen(httpHostConfig.port, httpHostConfig.listenHost, () => resolve());
    });
}

await runStatelessHttpMcpStandaloneFromArgv(process.argv.slice(2));
