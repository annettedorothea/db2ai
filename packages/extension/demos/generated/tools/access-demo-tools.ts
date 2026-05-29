/**
 * Generated from: access-demo.db2ai
 */
import { resolveCredentialAndOptionalJwt } from '@core2ai/core/mcp-host';
import { checkListCustomerOrdersParameters } from '../../src/auth/listCustomerOrders.js';

export const connectionEnv = 'ACCESS_DEMO_DATABASE_URL';

export const databaseDialect = 'postgres';

export const requiresAuth = true;

export type GeneratedSqlParam = {
    placeholder: string;
    index: number;
    name: string;
    propertyName: string;
    description: string;
    example?: string;
    jsonSchemaType: 'string' | 'integer' | 'number' | 'boolean';
};

export type GeneratedTool = {
    toolName: string;
    title: string;
    description: string;
    kind: 'sql';
    access: 'public' | 'protected' | 'checked';
    sqlText: string;
    params?: GeneratedSqlParam[];
};

export type InvokeOptions = Record<string, unknown>;

export type DbHostContext = {
    connectionString: string;
    databaseDialect: 'postgres' | 'mysql';
    credential?: string;
    jwt?: Record<string, unknown>;
};

export type CheckedHostContext = {
    credential: string;
    jwt?: Record<string, unknown>;
};

export const generatedTools: GeneratedTool[] = [
    {
        kind: 'sql',
        toolName: 'listProducts',
        title: 'Product catalog rows',
        description:
            'list products in the access-demo catalog\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows (example: 50)\n\nExample call: limit=50',
        access: 'public',
        sqlText: 'SELECT product_id, name, price FROM products ORDER BY product_id LIMIT $1',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows',
                example: '50',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'listProductsWithReviews',
        title: 'Products with reviews (requires credential)',
        description:
            'list products that have at least one review, with review details\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows (example: 50)\n\nExample call: limit=50',
        access: 'protected',
        sqlText:
            'SELECT p.product_id, p.name, p.price, r.review_id, r.rating, r.comment FROM products p INNER JOIN reviews r ON r.product_id = p.product_id ORDER BY p.product_id, r.review_id LIMIT LEAST($1, 200)',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows',
                example: '50',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'listCustomerOrders',
        title: 'Customer order rows',
        description:
            'list orders for a customer; customerId may be taken from the JWT when omitted\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- customerId ($1): customer id (defaults from JWT) (example: alice)\n\nExample call: customerId=alice',
        access: 'checked',
        sqlText:
            'SELECT order_id, customer_id, product_id, quantity FROM orders WHERE customer_id = $1 ORDER BY order_id',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'customerId',
                propertyName: 'customerId',
                description: 'customer id (defaults from JWT)',
                example: 'alice',
                jsonSchemaType: 'string'
            }
        ]
    }
];

export const mcpServerName = 'access-demo-tools';
export const mcpServerVersion = '0.0.2';

const parameterCheckers: Record<
    string,
    (options: InvokeOptions, host: CheckedHostContext) => InvokeOptions | Promise<InvokeOptions>
> = {
    listCustomerOrders: checkListCustomerOrdersParameters
};

import * as z from 'zod/v4';

export const inputZodByTool = {
    listProducts: z.object({ limit: z.number().describe('max rows (SQL $1)') }).strict(),
    listProductsWithReviews: z.object({ limit: z.number().describe('max rows (SQL $1)') }).strict(),
    listCustomerOrders: z
        .object({ customerId: z.string().describe('customer id (defaults from JWT) (SQL $1)').optional() })
        .strict()
};

const META_AUTH_ENV_KEY = 'MCP_HOST_AUTH_ENV_KEY';
const META_ENV_DIRS = 'MCP_HOST_ENV_DIRS';

function applyHostEnvKeys(hostConfig: { authEnv?: string }, envDirs: string[]): void {
    if (hostConfig.authEnv) {
        process.env[META_AUTH_ENV_KEY] = hostConfig.authEnv;
    } else {
        delete process.env[META_AUTH_ENV_KEY];
    }
    if (envDirs.length > 0) {
        process.env[META_ENV_DIRS] = JSON.stringify(envDirs);
    } else {
        delete process.env[META_ENV_DIRS];
    }
}

function isExpectedDatabaseUrl(connectionString: string): boolean {
    return connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://');
}

export const mcpHostAdapter = {
    configureFromArgv(argv: string[], envDirs: string[]): void {
        let authEnv: string | undefined;
        for (let i = 0; i < argv.length; i++) {
            const arg = argv[i];
            if (arg === '--auth-env') {
                authEnv = argv[++i];
                if (!authEnv) {
                    throw new Error('Missing value after --auth-env');
                }
                continue;
            }
            if (arg.startsWith('-')) {
                throw new Error('Unknown option: ' + arg);
            }
            throw new Error('Unexpected positional argument: ' + arg);
        }
        applyHostEnvKeys({ authEnv }, envDirs);
    },

    validateAtStartup(requiresAuth: boolean): void {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Environment variable "' + connectionEnv + '" is missing or empty (database env from .db2ai).'
            );
        }
        if (!isExpectedDatabaseUrl(connectionString)) {
            throw new Error(
                'Environment variable "' +
                    connectionEnv +
                    '" does not match generated database dialect "' +
                    databaseDialect +
                    '".'
            );
        }
        if (!requiresAuth) {
            return;
        }
        const authEnvName = process.env[META_AUTH_ENV_KEY]?.trim();
        if (!authEnvName) {
            throw new Error(
                'Generated tools include protected or checked access; pass --auth-env <ENV_VAR_NAME> on the MCP host.'
            );
        }
        // Credential value may be empty at startup — public tools work without a token; protected/checked fail at invoke.
    },

    resolveHostContext(): DbHostContext {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Missing database URL. Set environment variable "' + connectionEnv + '" (from database env in .db2ai).'
            );
        }
        if (!isExpectedDatabaseUrl(connectionString)) {
            throw new Error(
                'Database URL from "' +
                    connectionEnv +
                    '" does not match generated database dialect "' +
                    databaseDialect +
                    '".'
            );
        }

        const authKey = process.env[META_AUTH_ENV_KEY]?.trim();
        const { credential, jwt } = resolveCredentialAndOptionalJwt(authKey);
        return { connectionString, databaseDialect, credential, jwt };
    },

    envDirsForReload(): string[] {
        const raw = process.env[META_ENV_DIRS];
        if (!raw?.trim()) {
            return [];
        }
        try {
            const dirs: unknown = JSON.parse(raw);
            if (Array.isArray(dirs) && dirs.every((d) => typeof d === 'string')) {
                return dirs;
            }
        } catch {
            // ignore malformed config
        }
        return [];
    }
};

import { Client } from 'pg';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function normalizePostgresNumericParamValue(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
    hostContext?: DbHostContext
): Promise<unknown> {
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }

    const host: DbHostContext =
        hostContext !== undefined ? (hostContext as DbHostContext) : mcpHostAdapter.resolveHostContext();
    if (toolMeta.access !== 'public') {
        if (!host.credential || !String(host.credential).trim()) {
            throw new Error(
                'Missing host credential. Pass --auth-env on mcp-serve.mjs and set the variable (re-read on every tool call).'
            );
        }
    }
    let optionsResolved = options;
    if (toolMeta.access === 'checked') {
        const check = parameterCheckers[toolName];
        if (typeof check !== 'function') {
            throw new Error('No parameter checker for checked tool: ' + toolName);
        }
        optionsResolved = await Promise.resolve(
            check(options, {
                credential: String(host.credential).trim(),
                jwt: host.jwt
            })
        );
    }
    const connectionString = resolveConnectionString(host);
    const client = new Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
            case 'listProducts': {
                const result = await client.query({
                    text: 'SELECT product_id, name, price FROM products ORDER BY product_id LIMIT $1',
                    values: [normalizePostgresNumericParamValue(optionsResolved['limit'])]
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listProductsWithReviews': {
                const result = await client.query({
                    text: 'SELECT p.product_id, p.name, p.price, r.review_id, r.rating, r.comment FROM products p INNER JOIN reviews r ON r.product_id = p.product_id ORDER BY p.product_id, r.review_id LIMIT LEAST($1, 200)',
                    values: [normalizePostgresNumericParamValue(optionsResolved['limit'])]
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listCustomerOrders': {
                const result = await client.query({
                    text: 'SELECT order_id, customer_id, product_id, quantity FROM orders WHERE customer_id = $1 ORDER BY order_id',
                    values: [
                        optionsResolved['customerId'] !== undefined && optionsResolved['customerId'] !== null
                            ? String(optionsResolved['customerId'])
                            : null
                    ]
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
