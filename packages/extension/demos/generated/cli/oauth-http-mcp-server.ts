#!/usr/bin/env node
/**
 * Generated OAuth + stateful MCP Streamable HTTP host (static runtime — no @core2ai/core).
 */
import * as crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, type ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { loggingAdapter } from '../../src/utils/logging-adapter.js';

type CredentialTransformInput = {
    inboundCredential: string;
    inboundClaims?: Record<string, unknown>;
};

type CredentialTransformResult = {
    upstreamCredential: string;
    sessionJwtClaims?: Record<string, unknown>;
};

type CredentialTransformFn = (input: CredentialTransformInput) => Promise<CredentialTransformResult>;

/** Set at startup when --credential-transform-module is passed; otherwise inbound credential pass-through. */
let credentialTransformFn: CredentialTransformFn | undefined;

function resolveCredentialTransformModulePath(raw: string, envDirs: string[]): string {
    const trimmed = raw.trim();
    if (path.isAbsolute(trimmed)) {
        return path.resolve(trimmed);
    }
    const fromCwd = path.resolve(process.cwd(), trimmed);
    if (fs.existsSync(fromCwd)) {
        return fromCwd;
    }
    for (const dir of envDirs) {
        const candidate = path.resolve(dir, trimmed);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return fromCwd;
}

function missingCredentialTransformModuleError(resolvedPath: string, raw: string): string {
    return (
        '[credential-transform] --credential-transform-module points to a missing file: ' +
        resolvedPath +
        ' (argument: ' +
        raw +
        '). Create a credential transform module, e.g. src/auth/<mcpModule>/credentialTransform.ts ' +
        'exporting async function transformCredential(), run build:generated for credentialTransform.js, ' +
        'then pass --credential-transform-module with the path to that .js file.'
    );
}

async function loadCredentialTransformModule(httpHostConfig: OAuthHttpHostRuntimeConfig): Promise<void> {
    const raw = httpHostConfig.credentialTransformModule?.trim();
    if (!raw) {
        credentialTransformFn = undefined;
        return;
    }
    const modulePath = resolveCredentialTransformModulePath(raw, httpHostConfig.envDirs);
    if (!fs.existsSync(modulePath)) {
        throw new Error(missingCredentialTransformModuleError(modulePath, raw));
    }
    const imported = await import(pathToFileURL(modulePath).href);
    const fn = imported?.transformCredential;
    if (typeof fn !== 'function') {
        throw new Error(
            '[credential-transform] Module "' +
                modulePath +
                '" must export async function transformCredential() ' +
                '(hook for --credential-transform-module).'
        );
    }
    credentialTransformFn = fn as CredentialTransformFn;
    loggingAdapter.info('[mcp] credential transform module loaded', { module: modulePath });
}

const LOCAL_ENV_FILES = ['.env', '.env.local'];

type DatabaseDialect = 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle';

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

function validateOAuthCredentialValidationAtStartup(
    generated: GeneratedHostModule,
    httpHostConfig: OAuthHttpHostRuntimeConfig
): void {
    if (!generated.requiresAuth) {
        return;
    }
    const mode = httpHostConfig.tokenValidation;
    if (mode === 'static') {
        throw new Error(
            'credential validation mode "static" is not supported on OAuth HTTP — use opaque, hs256, or oidc.'
        );
    }
    if (mode === 'hs256') {
        readJwtSecretFromEnv(httpHostConfig.jwtSecretEnvKey!);
    } else if (mode === 'oidc') {
        if (!httpHostConfig.oauthIssuer?.trim()) {
            throw new Error('Required for oidc: --oauth-issuer <url>');
        }
    }
    warnCredentialValidationModeAtStartup(generated, mode);
}

type OAuthHttpHostRuntimeConfig = CredentialValidationFields & {
    baseUrlEnvKey?: string;
    envDirs: string[];
    listenHost: string;
    port: number;
    mcpPath: string;
    oauthIdpUrl: string;
    oauthScope: string;
    tokenValidation: HostCredentialValidationMode;
    jwtSecretEnvKey?: string;
    oauthIssuer: string;
    oauthAudience?: string;
    jwtClaimCustomerId: string;
    jwtClaimRole: string;
    credentialTransformModule?: string;
};

type McpOAuthSession = {
    sessionId: string;
    upstreamCredential?: string;
    sessionJwtClaims?: Record<string, unknown>;
    exchangedAt?: number;
    createdAt: number;
};

let oidcJwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let oidcJwksIssuer = '';

function parseOAuthHttpHostArgv(argv: string[], envDirs: string[]): OAuthHttpHostRuntimeConfig {
    let baseUrlEnv: string | undefined;
    let listenHost = '127.0.0.1';
    let port: number | undefined;
    let mcpPath = '/mcp';
    let oauthIdpUrl: string | undefined;
    let jwtSecretEnvKey: string | undefined;
    let tokenValidation: HostCredentialValidationMode = 'hs256';
    let oauthIssuer: string | undefined;
    let oauthAudience: string | undefined;
    let jwtClaimCustomerId = 'customerId';
    let jwtClaimRole = 'role';
    let oauthScope = 'mcp';
    let credentialTransformModule: string | undefined;
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
        if (arg === '--oauth-token-validation') {
            tokenValidation = parseHostCredentialValidationMode(argv[++i]);
            continue;
        }
        if (arg === '--jwt-secret-env') {
            jwtSecretEnvKey = argv[++i];
            if (!jwtSecretEnvKey) {
                throw new Error('Missing value after --jwt-secret-env');
            }
            continue;
        }
        if (arg === '--oauth-issuer') {
            oauthIssuer = argv[++i];
            if (!oauthIssuer) {
                throw new Error('Missing value after --oauth-issuer');
            }
            continue;
        }
        if (arg === '--oauth-audience') {
            oauthAudience = argv[++i];
            if (!oauthAudience) {
                throw new Error('Missing value after --oauth-audience');
            }
            continue;
        }
        if (arg === '--jwt-claim-customer-id') {
            jwtClaimCustomerId = argv[++i];
            if (!jwtClaimCustomerId) {
                throw new Error('Missing value after --jwt-claim-customer-id');
            }
            continue;
        }
        if (arg === '--jwt-claim-role') {
            jwtClaimRole = argv[++i];
            if (!jwtClaimRole) {
                throw new Error('Missing value after --jwt-claim-role');
            }
            continue;
        }
        if (arg === '--credential-transform-module') {
            credentialTransformModule = argv[++i];
            if (!credentialTransformModule?.trim()) {
                throw new Error('Missing value after --credential-transform-module');
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
    const idpUrl = oauthIdpUrl.replace(/\/$/, '');
    const issuer = (oauthIssuer ?? idpUrl).replace(/\/$/, '');
    if (tokenValidation === 'hs256' && !jwtSecretEnvKey?.trim()) {
        throw new Error('Required for hs256: --jwt-secret-env <ENV_VAR_NAME>');
    }
    return {
        baseUrlEnvKey: baseUrlEnv,
        envDirs,
        listenHost,
        port,
        mcpPath,
        oauthIdpUrl: idpUrl,
        oauthScope: oauthScope.trim(),
        tokenValidation,
        credentialValidation: tokenValidation,
        jwtSecretEnvKey: jwtSecretEnvKey?.trim(),
        oauthIssuer: issuer,
        oauthAudience: oauthAudience?.trim(),
        jwtClaimCustomerId: jwtClaimCustomerId.trim(),
        jwtClaimRole: jwtClaimRole.trim(),
        credentialTransformModule: credentialTransformModule?.trim()
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

async function ensureOidcJwks(issuer: string): Promise<ReturnType<typeof createRemoteJWKSet>> {
    const normalized = issuer.replace(/\/$/, '');
    if (oidcJwks && oidcJwksIssuer === normalized) {
        return oidcJwks;
    }
    const discoveryUrl = normalized + '/.well-known/openid-configuration';
    const response = await fetch(discoveryUrl);
    if (!response.ok) {
        throw new Error('OIDC discovery failed (' + response.status + '): ' + discoveryUrl);
    }
    const document = (await response.json()) as { jwks_uri?: string };
    const jwksUri = document.jwks_uri;
    if (typeof jwksUri !== 'string' || jwksUri.trim().length === 0) {
        throw new Error('OIDC discovery document missing jwks_uri: ' + discoveryUrl);
    }
    oidcJwks = createRemoteJWKSet(new URL(jwksUri));
    oidcJwksIssuer = normalized;
    return oidcJwks;
}

function normalizeHostJwtClaims(
    payload: Record<string, unknown>,
    httpHostConfig: OAuthHttpHostRuntimeConfig
): Record<string, unknown> {
    const customerRaw = payload[httpHostConfig.jwtClaimCustomerId];
    const roleRaw = payload[httpHostConfig.jwtClaimRole];
    const customerId = customerRaw !== undefined && customerRaw !== null ? String(customerRaw).trim() : '';
    const role = roleRaw !== undefined && roleRaw !== null ? String(roleRaw).trim() : '';
    const normalized: Record<string, unknown> = { ...payload };
    if (customerId.length > 0) {
        normalized.customerId = customerId;
    }
    if (role.length > 0) {
        normalized.role = role;
    }
    return normalized;
}

async function verifyOAuthBearerToken(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    token: string
): Promise<{ ok: true; payload?: Record<string, unknown> } | { ok: false }> {
    if (httpHostConfig.tokenValidation === 'opaque') {
        return token.trim().length > 0 ? { ok: true } : { ok: false };
    }
    if (httpHostConfig.tokenValidation === 'hs256') {
        const secret = readJwtSecretFromEnv(httpHostConfig.jwtSecretEnvKey!);
        return verifyAccessTokenJwt(token, secret);
    }
    try {
        const jwks = await ensureOidcJwks(httpHostConfig.oauthIssuer);
        const verifyOptions: { issuer: string; audience?: string } = { issuer: httpHostConfig.oauthIssuer };
        if (httpHostConfig.oauthAudience) {
            verifyOptions.audience = httpHostConfig.oauthAudience;
        }
        const { payload } = await jwtVerify(token, jwks, verifyOptions);
        return { ok: true, payload: payload as Record<string, unknown> };
    } catch {
        return { ok: false };
    }
}

function generatedHasPublicTool(generated: GeneratedHostModule): boolean {
    return generated.generatedTools.some((t) => t.access === 'public');
}

function generatedHasProtectedOrCheckedTool(generated: GeneratedHostModule): boolean {
    return generated.generatedTools.some((t) => t.access === 'protected' || t.access === 'checked');
}

async function validateOAuthHttpHostAtStartup(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule
): Promise<void> {
    validateOAuthCredentialValidationAtStartup(generated, httpHostConfig);
    if (httpHostConfig.tokenValidation === 'oidc') {
        await ensureOidcJwks(httpHostConfig.oauthIssuer);
    }
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

async function resolveHostContextOAuthPassThrough(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule,
    bearer: string | undefined,
    sessionStore: Map<string, McpOAuthSession>,
    sessionId: string | undefined
): Promise<ApiLikeHostContext> {
    let credential: string | undefined;
    let verifiedPayload: Record<string, unknown> | undefined;
    if (bearer) {
        const verified = await verifyOAuthBearerToken(httpHostConfig, bearer);
        if (verified.ok) {
            credential = bearer;
            verifiedPayload = verified.payload;
            if (sessionId) {
                const existing = sessionStore.get(sessionId);
                if (existing) {
                    existing.upstreamCredential = bearer;
                } else {
                    sessionStore.set(sessionId, {
                        sessionId,
                        upstreamCredential: bearer,
                        createdAt: Date.now()
                    });
                }
            }
        } else if (httpHostConfig.tokenValidation !== 'opaque') {
            throw new Error('Invalid OAuth Bearer token.');
        }
    }
    if (!credential && sessionId) {
        credential = sessionStore.get(sessionId)?.upstreamCredential;
        if (credential) {
            const cached = await verifyOAuthBearerToken(httpHostConfig, credential);
            if (cached.ok) {
                verifiedPayload = cached.payload;
            } else if (httpHostConfig.tokenValidation !== 'opaque') {
                throw new Error('Invalid OAuth Bearer token (session cache).');
            } else {
                credential = undefined;
            }
        }
    }
    const apiFields = oauthHostContextBaseUrlFields(httpHostConfig, generated);
    if (!credential?.trim()) {
        return { ...apiFields };
    }
    const trimmed = credential.trim();
    const jwt = verifiedPayload ? normalizeHostJwtClaims(verifiedPayload, httpHostConfig) : undefined;
    return { ...apiFields, credential: trimmed, jwt };
}

async function resolveHostContextWithCredentialTransform(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule,
    bearer: string | undefined,
    sessionStore: Map<string, McpOAuthSession>,
    sessionId: string | undefined
): Promise<ApiLikeHostContext> {
    let session = sessionId ? sessionStore.get(sessionId) : undefined;
    if (sessionId && !session) {
        session = { sessionId, createdAt: Date.now() };
        sessionStore.set(sessionId, session);
    }

    if (session?.exchangedAt && session.upstreamCredential) {
        const jwt =
            session.sessionJwtClaims && Object.keys(session.sessionJwtClaims).length > 0
                ? session.sessionJwtClaims
                : undefined;
        return {
            ...oauthHostContextBaseUrlFields(httpHostConfig, generated),
            credential: session.upstreamCredential,
            jwt
        };
    }

    let idpToken = bearer?.trim();
    if (!idpToken && session?.upstreamCredential && !session.exchangedAt) {
        idpToken = session.upstreamCredential.trim();
    }
    if (!idpToken) {
        return { ...oauthHostContextBaseUrlFields(httpHostConfig, generated) };
    }

    const verified = await verifyOAuthBearerToken(httpHostConfig, idpToken);
    if (!verified.ok) {
        throw new Error('Invalid OAuth Bearer token.');
    }

    const idpClaims = verified.payload ? normalizeHostJwtClaims(verified.payload, httpHostConfig) : undefined;
    if (!credentialTransformFn) {
        throw new Error('Credential transform module is not loaded.');
    }
    const exchanged = await credentialTransformFn({
        inboundCredential: idpToken,
        inboundClaims: idpClaims
    });
    const accessToken = exchanged.upstreamCredential.trim();
    if (accessToken.length === 0) {
        throw new Error('Credential transform module returned an empty upstream credential.');
    }
    const claims =
        exchanged.sessionJwtClaims && typeof exchanged.sessionJwtClaims === 'object'
            ? normalizeHostJwtClaims(exchanged.sessionJwtClaims as Record<string, unknown>, httpHostConfig)
            : {};
    if (session) {
        session.upstreamCredential = accessToken;
        session.sessionJwtClaims = claims;
        session.exchangedAt = Date.now();
    }

    const jwt = claims && Object.keys(claims).length > 0 ? claims : undefined;
    return {
        ...oauthHostContextBaseUrlFields(httpHostConfig, generated),
        credential: accessToken,
        jwt
    };
}

async function resolveHostContextForOAuthSession(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule,
    headers: Record<string, string | string[] | undefined>,
    sessionStore: Map<string, McpOAuthSession>,
    sessionId: string | undefined
): Promise<ApiLikeHostContext> {
    const bearer = readBearerFromHeaders(headers);
    const hostContext = credentialTransformFn
        ? await resolveHostContextWithCredentialTransform(httpHostConfig, generated, bearer, sessionStore, sessionId)
        : await resolveHostContextOAuthPassThrough(httpHostConfig, generated, bearer, sessionStore, sessionId);
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
        return { ...hostContext, connectionString, databaseDialect: dialect };
    }
    return hostContext;
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

type SessionEntry = {
    transport: StreamableHTTPServerTransport;
    server: McpServer;
    session: McpOAuthSession;
};

const sessionEntries = new Map<string, SessionEntry>();
const sessionStore = new Map<string, McpOAuthSession>();
const sessionHeaders = new Map<string, Record<string, string | string[] | undefined>>();

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
    return generated.requiresAuth && generatedHasProtectedOrCheckedTool(generated);
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
    const { name, version } = requireMcpServerIdentity(generated);
    const server = new McpServer({ name, version });
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
        void server.close();
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
        const verified =
            httpHostConfig.tokenValidation === 'opaque'
                ? { ok: Boolean(bearer?.trim()) }
                : bearer
                  ? await verifyOAuthBearerToken(httpHostConfig, bearer)
                  : { ok: false as const };
        if (!verified.ok) {
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
        res.writeHead(400).end('Missing session ID');
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

async function runOAuthHttpMcpStandaloneFromArgv(argv: string[]): Promise<void> {
    const modulePath = argv[0];
    if (!modulePath) {
        throw new Error(
            'Usage: node oauth-http-mcp-server.js <path-to-*-tools.js> [--base-url-env ENV] --oauth-idp-url URL --port N [--oauth-token-validation hs256|oidc|opaque] [--jwt-secret-env ENV] [--oauth-issuer URL] [--oauth-audience AUD] [--credential-transform-module PATH] [--host HOST] [--path /mcp]'
        );
    }
    const envDirs = [process.cwd(), path.dirname(path.resolve(modulePath))];
    loadLocalEnvFiles(envDirs);
    const imported = await import(pathToFileURL(path.resolve(modulePath)).href);
    if (!imported || typeof imported !== 'object') {
        throw new Error(`Generated module "${modulePath}" did not export an object.`);
    }
    const generated = readGeneratedModule(imported as Record<string, unknown>);
    const httpHostConfig = parseOAuthHttpHostArgv(argv.slice(1), envDirs);
    await loadCredentialTransformModule(httpHostConfig);
    if (!generated.connectionEnv && !httpHostConfig.baseUrlEnvKey) {
        throw new Error(
            'Required: --base-url-env <ENV_VAR_NAME> for HTTP/OpenAPI tools, or export connectionEnv from a .db2ai module.'
        );
    }
    await validateOAuthHttpHostAtStartup(httpHostConfig, generated);
    const resourceUrl = 'http://' + httpHostConfig.listenHost + ':' + httpHostConfig.port + httpHostConfig.mcpPath;
    loggingAdapter.info('[mcp] oauth HTTP listening', {
        resourceUrl,
        authorizationServer: httpHostConfig.oauthIdpUrl,
        tokenValidation: httpHostConfig.tokenValidation,
        oauthIssuer: httpHostConfig.tokenValidation === 'oidc' ? httpHostConfig.oauthIssuer : undefined,
        oauthOnInitialize: mcpRequiresBearerOnInitialize(generated)
            ? 'Bearer required (protected/checked tools — Cursor login when enabling MCP' +
              (generatedHasPublicTool(generated) ? '; public tools after login' : '') +
              ')'
            : 'no Bearer required (only public tools)'
    });

    const httpServer = http.createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://' + (req.headers.host ?? 'localhost'));
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
        httpServer.listen(httpHostConfig.port, httpHostConfig.listenHost, () => resolve());
    });
}

await runOAuthHttpMcpStandaloneFromArgv(process.argv.slice(2));
