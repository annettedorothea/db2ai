/**
 * Generated OAuth + stateful MCP Streamable HTTP runtime (static tools import).
 */
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, type ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';

const LOCAL_ENV_FILES = ['.env', '.env.local'];

type DatabaseDialect = 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle';

/** Host context inside MCP server templates. Tool modules use DbHostContext; this wider shape is shared across stdio/HTTP hosts. */
type ApiLikeHostContext = {
    baseUrl?: string;
    connectionString?: string;
    databaseDialect?: DatabaseDialect;
    credential?: string;
};

type VerifyCredentialFn = (credential: string) => void | Promise<void>;

type TokenExchangeFn = (idpCredential: string) => Promise<string>;

type GeneratedHostModule = {
    generatedTools: Array<{ toolName: string; title?: string; description: string; access?: string }>;
    invokeTool: (toolName: string, args?: Record<string, unknown>, hostContext?: unknown) => Promise<unknown>;
    inputZodByTool?: Record<string, unknown>;
    mcpServerName?: string;
    mcpServerVersion?: string;
    mcpBuildGeneratedAt?: string;
    requiresAuth: boolean;
    connectionEnv?: string;
    databaseDialect?: DatabaseDialect;
    verifyCredential?: VerifyCredentialFn;
    tokenExchange?: TokenExchangeFn;
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

function parseDatabaseDialect(value: unknown): DatabaseDialect | undefined {
    return value === 'postgres' ||
        value === 'mysql' ||
        value === 'mariadb' ||
        value === 'sqlserver' ||
        value === 'oracle'
        ? value
        : undefined;
}

function isExpectedDatabaseUrl(connectionString: string, dialect: DatabaseDialect): boolean {
    if (dialect === 'mysql') {
        return connectionString.startsWith('mysql://');
    }
    if (dialect === 'mariadb') {
        return connectionString.startsWith('mariadb://');
    }
    if (dialect === 'sqlserver') {
        return (
            connectionString.startsWith('sqlserver://') ||
            connectionString.startsWith('mssql://') ||
            /^Server=/i.test(connectionString)
        );
    }
    if (dialect === 'oracle') {
        return connectionString.startsWith('oracle://');
    }
    return connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://');
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
    const mcpBuildGeneratedAt = imported.mcpBuildGeneratedAt;
    const connectionEnv = imported.connectionEnv;
    const verifyCredential = imported.verifyCredential;
    const verifyCredentialFn =
        typeof verifyCredential === 'function' ? (verifyCredential as VerifyCredentialFn) : undefined;
    const tokenExchange = imported.tokenExchange;
    const tokenExchangeFn = typeof tokenExchange === 'function' ? (tokenExchange as TokenExchangeFn) : undefined;
    return {
        generatedTools: generatedTools as Array<{
            toolName: string;
            title?: string;
            description: string;
            access?: string;
        }>,
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
        mcpBuildGeneratedAt: typeof mcpBuildGeneratedAt === 'string' ? mcpBuildGeneratedAt : undefined,
        requiresAuth: imported.requiresAuth === true,
        connectionEnv: typeof connectionEnv === 'string' ? connectionEnv : undefined,
        databaseDialect: parseDatabaseDialect(imported.databaseDialect),
        verifyCredential: verifyCredentialFn,
        tokenExchange: tokenExchangeFn
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

function formatMcpBuildLine(generated: GeneratedHostModule): string | undefined {
    const semver = generated.mcpServerVersion?.trim();
    const buildAt = generated.mcpBuildGeneratedAt?.trim();
    if (semver && buildAt) {
        return semver + ' · ' + buildAt;
    }
    return semver ?? buildAt;
}

function formatMcpDisplayVersion(generated: GeneratedHostModule): string {
    const line = formatMcpBuildLine(generated);
    if (!line) {
        throw new Error('Generated module must export "mcpServerVersion". Regenerate tool code.');
    }
    return line;
}

function formatMcpServerVersionFields(generated: GeneratedHostModule): { label: string; value: string }[] {
    const semver = generated.mcpServerVersion?.trim();
    const buildAt = generated.mcpBuildGeneratedAt?.trim();
    const fields: { label: string; value: string }[] = [];
    if (semver) {
        fields.push({ label: 'Version:', value: semver });
    }
    if (buildAt) {
        fields.push({ label: 'Build:', value: buildAt });
    }
    return fields;
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

function formatMcpToolDescription(generated: GeneratedHostModule, toolDescription: string): string {
    const buildLine = formatMcpBuildLine(generated);
    if (!buildLine) {
        return toolDescription;
    }
    return 'MCP build: ' + buildLine + '\n\n---\n\n' + toolDescription;
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
                description: formatMcpToolDescription(generated, tool.description),
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

function formatStartupFieldLine(label: string, value: string): string {
    const pad = ' '.repeat(Math.max(1, 10 - label.length));
    return '     ' + label + pad + value;
}

function printMcpHostStartupBanner(options: {
    serverName: string;
    transport: string;
    status?: 'ready' | 'warning';
    note?: string;
    fields: { label: string; value: string }[];
}): void {
    const status = options.status ?? 'ready';
    const glyph = status === 'warning' ? '▲' : '●';
    const lines = ['', '  ┌─ ' + options.serverName + ' (' + options.transport + ') ' + glyph + ' ' + status + ' ─'];
    if (options.note) {
        lines.push(formatStartupFieldLine('Note:', options.note));
    }
    for (const field of options.fields) {
        lines.push(formatStartupFieldLine(field.label, field.value));
    }
    lines.push('  └────────────────────────────────────────────');
    lines.push('');
    loggingAdapter.banner(lines);
}

function describeUpstreamEnvField(
    generated: GeneratedHostModule,
    hostConfig: { baseUrlEnvKey?: string }
): { label: string; value: string } | undefined {
    if (generated.connectionEnv) {
        const key = generated.connectionEnv;
        const set = Boolean(process.env[key]?.trim());
        return { label: 'Database:', value: key + (set ? '' : ' (unset)') };
    }
    const key = hostConfig.baseUrlEnvKey?.trim();
    if (!key) {
        return undefined;
    }
    const set = Boolean(process.env[key]?.trim());
    return { label: 'Upstream:', value: key + (set ? '' : ' (unset)') };
}

function collectMissingEnvNote(keys: (string | undefined)[]): string | undefined {
    const missing = keys
        .filter((key): key is string => Boolean(key?.trim()))
        .filter((key) => !process.env[key]?.trim());
    if (missing.length === 0) {
        return undefined;
    }
    return missing.join(', ') + ' unset — tool calls may fail until set in .env';
}

function requireMcpServerDisplayName(generated: GeneratedHostModule): string {
    const { name } = requireMcpServerIdentity(generated);
    return name;
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

/** GET/DELETE without an established session — spec-allowed probe response (HTTP clients verifying connection). */
function writeJsonRpcMethodNotAllowed(res: ServerResponse): void {
    writeJsonRpcError(res, 405, -32_000, 'Method not allowed.');
}

type OAuthHttpHostRuntimeConfig = {
    baseUrlEnvKey?: string;
    envDirs: string[];
    listenHost: string;
    port: number;
    mcpPath: string;
    oauthIdpUrl: string;
    oauthScope: string;
};

type McpOAuthSession = {
    sessionId: string;
    credential?: string;
    sourceCredential?: string;
    verifiedAt?: number;
    exchangedAt?: number;
    createdAt: number;
};

/** IdP Bearer → portal/API credential (shared by gate + session resolver). */
const oauthCredentialByInbound = new Map<string, string>();

function parseOAuthHttpHostArgv(argv: string[], envDirs: string[]): OAuthHttpHostRuntimeConfig {
    let baseUrlEnv: string | undefined;
    let listenHost = '127.0.0.1';
    let port: number | undefined;
    let mcpPath = '/mcp';
    let oauthIdpUrl: string | undefined;
    let oauthScope = 'mcp';
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--base-url-env') {
            baseUrlEnv = argv[++i];
            if (!baseUrlEnv) {
                throw new Error('Missing value after --base-url-env');
            }
            continue;
        }
        if (arg === '--oauth-idp-url') {
            oauthIdpUrl = argv[++i];
            if (!oauthIdpUrl) {
                throw new Error('Missing value after --oauth-idp-url');
            }
            continue;
        }
        if (arg === '--oauth-scope') {
            oauthScope = argv[++i];
            if (!oauthScope?.trim()) {
                throw new Error('Missing value after --oauth-scope');
            }
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
    if (!oauthIdpUrl?.trim()) {
        throw new Error('Required: --oauth-idp-url <url>');
    }
    return {
        baseUrlEnvKey: baseUrlEnv,
        envDirs,
        listenHost,
        port,
        mcpPath,
        oauthIdpUrl: oauthIdpUrl.replace(/\/$/, ''),
        oauthScope: oauthScope.trim()
    };
}

function readBearerFromHeaders(headers: Record<string, string | string[] | undefined>): string | undefined {
    const raw = headers.authorization ?? headers.Authorization;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value !== 'string') {
        return undefined;
    }
    const match = /^Bearer\s+(.+)$/i.exec(value.trim());
    return match?.[1]?.trim() || undefined;
}

function generatedHasProtectedTool(generated: GeneratedHostModule): boolean {
    return generated.generatedTools.some((t) => t.access === 'protected');
}

function validateOAuthHttpHostAtStartup(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
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
}

function resolveOAuthHostBaseUrl(httpHostConfig: OAuthHttpHostRuntimeConfig): string {
    const baseUrlKey = httpHostConfig.baseUrlEnvKey?.trim();
    const baseUrl = baseUrlKey ? process.env[baseUrlKey]?.trim() : undefined;
    if (!baseUrl) {
        throw new Error('Missing host base URL. Pass --base-url-env on oauth-http-mcp-server.js and set the variable.');
    }
    return baseUrl;
}

function oauthHostContextBaseUrlFields(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule
): Pick<ApiLikeHostContext, 'baseUrl'> {
    if (generated.connectionEnv) {
        return {};
    }
    return { baseUrl: resolveOAuthHostBaseUrl(httpHostConfig) };
}

async function resolveOAuthSessionCredential(
    generated: GeneratedHostModule,
    inboundIdpToken: string,
    session: McpOAuthSession | undefined
): Promise<string> {
    const inbound = inboundIdpToken.trim();
    if (session?.exchangedAt && session.credential && session.sourceCredential === inbound) {
        return session.credential;
    }

    const cached = oauthCredentialByInbound.get(inbound);
    if (cached) {
        if (session) {
            session.credential = cached;
            session.sourceCredential = inbound;
            session.exchangedAt = Date.now();
            session.verifiedAt = Date.now();
        }
        return cached;
    }

    let credential = inbound;
    const exchange = generated.tokenExchange;
    if (typeof exchange === 'function') {
        credential = String(await exchange(inbound)).trim();
        if (!credential) {
            throw new Error('tokenExchange returned an empty credential.');
        }
    }

    const verify = generated.verifyCredential;
    if (typeof verify === 'function') {
        await verify(credential);
    }

    oauthCredentialByInbound.set(inbound, credential);

    if (session) {
        session.credential = credential;
        session.sourceCredential = inbound;
        session.exchangedAt = Date.now();
        session.verifiedAt = Date.now();
    }

    return credential;
}

async function verifyCredentialForGate(
    generated: GeneratedHostModule,
    bearer: string | undefined,
    session?: McpOAuthSession
): Promise<boolean> {
    const token = bearer?.trim();
    if (!token) {
        return false;
    }
    if (!generated.requiresAuth) {
        return true;
    }
    const verify = generated.verifyCredential;
    const exchange = generated.tokenExchange;
    if (typeof verify !== 'function' && typeof exchange !== 'function') {
        return true;
    }
    try {
        await resolveOAuthSessionCredential(generated, token, session);
        return true;
    } catch {
        return false;
    }
}

function enrichDbHostContext(generated: GeneratedHostModule, context: ApiLikeHostContext): ApiLikeHostContext {
    if (!generated.connectionEnv) {
        return context;
    }
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
    return { ...context, connectionString, databaseDialect: dialect };
}

async function resolveHostContextForOAuthSession(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule,
    headers: Record<string, string | string[] | undefined>,
    sessionStore: Map<string, McpOAuthSession>,
    sessionId: string | undefined
): Promise<ApiLikeHostContext> {
    const apiFields = oauthHostContextBaseUrlFields(httpHostConfig, generated);
    let session = sessionId ? sessionStore.get(sessionId) : undefined;
    if (sessionId && !session) {
        session = { sessionId, createdAt: Date.now() };
        sessionStore.set(sessionId, session);
    }

    const bearer = readBearerFromHeaders(headers);
    const inbound = bearer?.trim();

    if (session?.exchangedAt && session.credential && (!inbound || session.sourceCredential === inbound)) {
        return enrichDbHostContext(generated, {
            ...apiFields,
            credential: session.credential
        });
    }

    if (!inbound) {
        if (session?.credential) {
            return enrichDbHostContext(generated, {
                ...apiFields,
                credential: session.credential
            });
        }
        return enrichDbHostContext(generated, { ...apiFields });
    }

    const credential = await resolveOAuthSessionCredential(generated, inbound, session);

    return enrichDbHostContext(generated, {
        ...apiFields,
        credential
    });
}

function oauthResourceMetadataDocument(httpHostConfig: OAuthHttpHostRuntimeConfig): Record<string, unknown> {
    const resource = 'http://' + httpHostConfig.listenHost + ':' + httpHostConfig.port + httpHostConfig.mcpPath;
    return {
        resource,
        authorization_servers: [httpHostConfig.oauthIdpUrl],
        bearer_methods_supported: ['header'],
        scopes_supported: [httpHostConfig.oauthScope]
    };
}

/** Browser clients discover OAuth metadata from the MCP host origin — endpoints must point at the real IdP. */
function oauthAuthorizationServerMetadataDocument(httpHostConfig: OAuthHttpHostRuntimeConfig): Record<string, unknown> {
    const idp = httpHostConfig.oauthIdpUrl;
    return {
        issuer: idp,
        authorization_endpoint: idp + '/authorize',
        token_endpoint: idp + '/token',
        jwks_uri: idp + '/jwks',
        registration_endpoint: idp + '/register',
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
        scopes_supported: [httpHostConfig.oauthScope]
    };
}

/**
 * Browser CORS for oauth HTTP host. Set MCP_HTTP_CORS_ORIGIN for a fixed origin; otherwise reflect Origin when present.
 */
function applyMcpHttpCors(req: IncomingMessage, res: ServerResponse, env: NodeJS.ProcessEnv = process.env): void {
    const configured = env.MCP_HTTP_CORS_ORIGIN?.trim();
    if (configured) {
        res.setHeader('Access-Control-Allow-Origin', configured);
    } else {
        const origin = req.headers.origin;
        if (typeof origin === 'string' && origin.length > 0) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
        }
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, mcp-session-id');
}

function sendOAuthUnauthorized(res: ServerResponse, httpHostConfig: OAuthHttpHostRuntimeConfig): void {
    const resource = 'http://' + httpHostConfig.listenHost + ':' + httpHostConfig.port + httpHostConfig.mcpPath;
    const metadataUrl =
        'http://' + httpHostConfig.listenHost + ':' + httpHostConfig.port + '/.well-known/oauth-protected-resource';
    res.writeHead(401, {
        'content-type': 'application/json',
        'www-authenticate':
            'Bearer error="invalid_token", realm="mcp", resource_metadata="' +
            metadataUrl +
            '", resource="' +
            resource +
            '", scope="' +
            httpHostConfig.oauthScope +
            '"'
    });
    res.end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32_001, message: 'Unauthorized' },
            id: null
        })
    );
}

function printOAuthHttpStartupBanner(generated: GeneratedHostModule, httpHostConfig: OAuthHttpHostRuntimeConfig): void {
    const url = 'http://' + httpHostConfig.listenHost + ':' + httpHostConfig.port + httpHostConfig.mcpPath;
    const fields: { label: string; value: string }[] = [
        { label: 'URL:', value: url },
        { label: 'Auth:', value: 'OAuth Bearer (MCP login)' },
        { label: 'Scope:', value: httpHostConfig.oauthScope },
        { label: 'IdP URL:', value: httpHostConfig.oauthIdpUrl }
    ];
    fields.push(...formatMcpServerVersionFields(generated));
    const upstream = describeUpstreamEnvField(generated, httpHostConfig);
    if (upstream) {
        fields.push(upstream);
    }
    const note = collectMissingEnvNote([generated.connectionEnv, httpHostConfig.baseUrlEnvKey]);
    printMcpHostStartupBanner({
        serverName: requireMcpServerDisplayName(generated),
        transport: 'oauth-http',
        status: note ? 'warning' : 'ready',
        note,
        fields
    });
}

type SessionEntry = {
    transport: StreamableHTTPServerTransport;
    server: McpServer;
    session: McpOAuthSession;
};

const sessionEntries = new Map<string, SessionEntry>();
const sessionStore = new Map<string, McpOAuthSession>();
const sessionHeaders = new Map<string, Record<string, string | string[] | undefined>>();

function defaultMcpEnvDirs(): string[] {
    const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
    return [process.cwd(), path.join(runtimeDir, '..', 'tools')];
}

function isInitializeRequestBody(body: unknown): boolean {
    if (Array.isArray(body)) {
        return body.some((item) => isInitializeRequestBody(item));
    }
    if (!body || typeof body !== 'object') {
        return false;
    }
    const record = body as Record<string, unknown>;
    return record.jsonrpc === '2.0' && record.method === 'initialize';
}

function mcpRequiresBearerOnInitialize(generated: GeneratedHostModule): boolean {
    return generated.requiresAuth && generatedHasProtectedTool(generated);
}

function readSessionId(req: IncomingMessage): string | undefined {
    const raw = req.headers['mcp-session-id'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

async function createMcpServerForSession(
    generated: GeneratedHostModule,
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    sessionId: string,
    headers: Record<string, string | string[] | undefined>
): Promise<SessionEntry> {
    const { name } = requireMcpServerIdentity(generated);
    const server = new McpServer({ name, version: formatMcpDisplayVersion(generated) });
    const session: McpOAuthSession = {
        sessionId,
        createdAt: Date.now()
    };
    sessionStore.set(sessionId, session);
    await registerMcpTools(server, generated, {
        envDirs: httpHostConfig.envDirs,
        resolveContext: async () => {
            const hdr = sessionHeaders.get(sessionId) ?? headers;
            return await resolveHostContextForOAuthSession(httpHostConfig, generated, hdr, sessionStore, sessionId);
        }
    });
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        onsessioninitialized: (sid) => {
            session.sessionId = sid;
        }
    });
    transport.onclose = () => {
        sessionEntries.delete(sessionId);
        sessionStore.delete(sessionId);
        sessionHeaders.delete(sessionId);
    };
    await server.connect(transport);
    return { transport, server, session };
}

async function handleOAuthMcpRequest(
    req: IncomingMessage,
    res: ServerResponse,
    generated: GeneratedHostModule,
    httpHostConfig: OAuthHttpHostRuntimeConfig
): Promise<void> {
    const headers = req.headers as Record<string, string | string[] | undefined>;
    const sessionIdHeader = readSessionId(req);
    const parsedBody = req.method === 'POST' ? await readMcpHttpJsonBody(req) : undefined;

    if (mcpRequiresBearerOnInitialize(generated)) {
        const bearer = readBearerFromHeaders(headers);
        const sessionForGate = sessionIdHeader ? sessionStore.get(sessionIdHeader) : undefined;
        const verified = await verifyCredentialForGate(generated, bearer, sessionForGate);
        if (!verified) {
            if (!sessionIdHeader && isInitializeRequestBody(parsedBody)) {
                sendOAuthUnauthorized(res, httpHostConfig);
                return;
            }
            if (sessionIdHeader && !sessionEntries.has(sessionIdHeader)) {
                sendOAuthUnauthorized(res, httpHostConfig);
                return;
            }
        }
    }

    let entry: SessionEntry | undefined;
    if (sessionIdHeader && sessionEntries.has(sessionIdHeader)) {
        entry = sessionEntries.get(sessionIdHeader);
    } else if (req.method === 'POST' && isInitializeRequestBody(parsedBody)) {
        const newSessionId = randomUUID();
        entry = await createMcpServerForSession(generated, httpHostConfig, newSessionId, headers);
        sessionEntries.set(newSessionId, entry);
    } else if (sessionIdHeader) {
        writeJsonRpcError(res, 404, -32_001, 'Session not found');
        return;
    } else if (req.method === 'POST') {
        writeJsonRpcError(res, 400, -32_000, 'Bad Request: Session ID required');
        return;
    } else {
        writeJsonRpcMethodNotAllowed(res);
        return;
    }

    if (!entry) {
        writeJsonRpcInternalError(res);
        return;
    }

    const activeSessionId = entry.session.sessionId;
    sessionHeaders.set(activeSessionId, headers);

    try {
        await entry.transport.handleRequest(req, res, parsedBody);
    } catch (err) {
        loggingAdapter.error('[mcp] oauth HTTP request failed', {
            error: err instanceof Error ? err.message : String(err)
        });
        if (!res.headersSent) {
            writeJsonRpcInternalError(res);
        }
    }
}

async function listenOAuthHttpMcp(
    generated: GeneratedHostModule,
    httpHostConfig: OAuthHttpHostRuntimeConfig
): Promise<void> {
    const httpServer = http.createServer(async (req, res) => {
        applyMcpHttpCors(req, res);
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const url = new URL(req.url ?? '/', 'http://' + (req.headers.host ?? 'localhost'));
        if (
            (url.pathname === '/.well-known/oauth-authorization-server' ||
                url.pathname === '/.well-known/openid-configuration') &&
            req.method === 'GET'
        ) {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify(oauthAuthorizationServerMetadataDocument(httpHostConfig)));
            return;
        }
        if (url.pathname === '/.well-known/oauth-protected-resource') {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify(oauthResourceMetadataDocument(httpHostConfig)));
            return;
        }
        if (url.pathname === '/oauth/login') {
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
            res.end(
                '<!doctype html><html><body><h1>MCP OAuth</h1><p>Use Cursor MCP &quot;Needs login&quot; for PKCE OAuth, or open the IDP authorize URL from MCP logs.</p><p>IDP: ' +
                    httpHostConfig.oauthIdpUrl +
                    '/authorize</p></body></html>'
            );
            return;
        }
        if (url.pathname !== httpHostConfig.mcpPath) {
            res.writeHead(404).end('Not found');
            return;
        }
        if (req.method === 'POST' || req.method === 'GET' || req.method === 'DELETE') {
            await handleOAuthMcpRequest(req, res, generated, httpHostConfig);
            return;
        }
        res.writeHead(405).end('Method not allowed');
    });

    await new Promise<void>((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.listen(httpHostConfig.port, httpHostConfig.listenHost, () => {
            printOAuthHttpStartupBanner(generated, httpHostConfig);
            resolve();
        });
    });
}

export async function runOAuthHttpMcp(
    toolsModule: Record<string, unknown>,
    argv: string[],
    envDirs: string[] = defaultMcpEnvDirs()
): Promise<void> {
    loadLocalEnvFiles(envDirs);
    const generated = readGeneratedModule(toolsModule);
    const httpHostConfig = parseOAuthHttpHostArgv(argv, envDirs);
    if (!generated.connectionEnv && !httpHostConfig.baseUrlEnvKey) {
        throw new Error(
            'Required: --base-url-env <ENV_VAR_NAME> for HTTP/OpenAPI tools, or export connectionEnv from a .db2ai module.'
        );
    }
    await validateOAuthHttpHostAtStartup(httpHostConfig, generated);
    await listenOAuthHttpMcp(generated, httpHostConfig);
}
