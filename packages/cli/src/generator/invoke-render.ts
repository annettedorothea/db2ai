import {
    DEFAULT_MAX_LIMIT_CAP,
    DEFAULT_PAGE_LIMIT,
    type ResolvedDatabaseDialect,
    type SqlParamType
} from 'db-2-ai-dsl-language';
import {
    quoteMysqlIdent,
    quotePostgresIdent,
    type ResolvedDbToolCodegen,
    type ResolvedSqlToolCodegen,
    type ResolvedTableToolCodegen
} from '../db-query-codegen.js';

function quoteDatabaseIdent(ident: string, dialect: ResolvedDatabaseDialect): string {
    return dialect === 'mysql' ? quoteMysqlIdent(ident) : quotePostgresIdent(ident);
}

function renderOptionValueExpression(
    propertyName: string,
    dialect: ResolvedDatabaseDialect,
    paramType: SqlParamType
): string {
    const optionAccess = `options[${JSON.stringify(propertyName)}]`;
    if (dialect === 'mysql') {
        if (paramType === 'boolean') {
            return `normalizeMysqlBooleanParamValue(${optionAccess})`;
        }
        return `normalizeMysqlParamValue(${optionAccess})`;
    }
    if (paramType === 'integer' || paramType === 'number') {
        return `normalizePostgresNumericParamValue(${optionAccess})`;
    }
    if (paramType === 'boolean') {
        return `normalizePostgresBooleanParamValue(${optionAccess})`;
    }
    return `${optionAccess} !== undefined && ${optionAccess} !== null ? String(${optionAccess}) : null`;
}

function renderTableInvokeCase(tool: ResolvedTableToolCodegen, dialect: ResolvedDatabaseDialect): string {
    const quotedTable = quoteDatabaseIdent(tool.table, dialect);
    const limitPlaceholder = dialect === 'mysql' ? '?' : '$1';
    const offsetPlaceholder = dialect === 'mysql' ? '?' : '$2';
    const queryCall =
        dialect === 'mysql'
            ? `const [rows] = await client.query(sql, [effectiveLimit, offset]);
            const resultRows = normalizeMysqlRows(rows);`
            : `const result = await client.query(sql, [effectiveLimit, offset]);`;
    const rowsExpression = dialect === 'mysql' ? 'resultRows' : 'result.rows';
    const rowCountExpression = dialect === 'mysql' ? 'resultRows.length' : 'result.rowCount ?? result.rows.length';
    const tableSql = `SELECT * FROM ${quotedTable} LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;
    return `        case ${JSON.stringify(tool.toolName)}: {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
                ${tool.maxLimitCap}
            );
            const offset =
                typeof options.offset === 'number' && Number.isFinite(options.offset) && options.offset >= 0
                    ? Math.floor(options.offset)
                    : 0;
            const sql = ${JSON.stringify(tableSql)};
            ${queryCall}
            return {
                rows: ${rowsExpression},
                rowCount: ${rowCountExpression},
                limit: effectiveLimit,
                offset
            };
        }`;
}

function rewriteLogicalPlaceholdersForMysql(sqlText: string): string {
    return sqlText.replace(/\$[0-9]+/g, '?');
}

function renderSqlInvokeCase(tool: ResolvedSqlToolCodegen, dialect: ResolvedDatabaseDialect): string {
    const paramsByPlaceholder = new Map(tool.params.map((p) => [p.placeholder, p]));
    const orderedExprs = Array.from(tool.sqlText.matchAll(/\$[0-9]+/g), (match) => {
        const param = paramsByPlaceholder.get(match[0]);
        if (!param) {
            throw new Error(`Codegen: SQL query references ${match[0]}, but no matching param was resolved.`);
        }
        return renderOptionValueExpression(param.propertyName, dialect, param.jsonSchemaType);
    });
    const valueExprs = orderedExprs.join(', ');
    if (dialect === 'mysql') {
        return `        case ${JSON.stringify(tool.toolName)}: {
            const [rows] = await client.query(${JSON.stringify(rewriteLogicalPlaceholdersForMysql(tool.sqlText))}, [${valueExprs}]);
            const resultRows = normalizeMysqlRows(rows);
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }`;
    }
    return `        case ${JSON.stringify(tool.toolName)}: {
            const result = await client.query({ text: ${JSON.stringify(tool.sqlText)}, values: [${valueExprs}] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }`;
}

type InvokeParamHelperFlags = {
    postgresNumeric: boolean;
    postgresBoolean: boolean;
    mysqlBoolean: boolean;
};

function resolveInvokeParamHelperFlags(tools: ResolvedDbToolCodegen[]): InvokeParamHelperFlags {
    const flags: InvokeParamHelperFlags = {
        postgresNumeric: false,
        postgresBoolean: false,
        mysqlBoolean: false
    };
    for (const tool of tools) {
        if (tool.kind !== 'sql') {
            continue;
        }
        for (const param of tool.params) {
            if (param.jsonSchemaType === 'integer' || param.jsonSchemaType === 'number') {
                flags.postgresNumeric = true;
            }
            if (param.jsonSchemaType === 'boolean') {
                flags.postgresBoolean = true;
                flags.mysqlBoolean = true;
            }
        }
    }
    return flags;
}

function renderInvokeSwitchCases(tools: ResolvedDbToolCodegen[], dialect: ResolvedDatabaseDialect): string {
    return tools
        .map((tool) =>
            tool.kind === 'table' ? renderTableInvokeCase(tool, dialect) : renderSqlInvokeCase(tool, dialect)
        )
        .join('\n');
}

const POSTGRES_NUMERIC_HELPER_TS = `
function normalizePostgresNumericParamValue(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}
`.trim();

const POSTGRES_BOOLEAN_HELPER_TS = `
function normalizePostgresBooleanParamValue(value: unknown): boolean | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const POSTGRES_NUMERIC_HELPER_JS = `
function normalizePostgresNumericParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}
`.trim();

const POSTGRES_BOOLEAN_HELPER_JS = `
function normalizePostgresBooleanParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const MYSQL_BOOLEAN_HELPER_TS = `
function normalizeMysqlBooleanParamValue(value: unknown): boolean | null {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

const MYSQL_BOOLEAN_HELPER_JS = `
function normalizeMysqlBooleanParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    const lower = String(value).trim().toLowerCase();
    if (lower === 'true') {
        return true;
    }
    if (lower === 'false') {
        return false;
    }
    return null;
}
`.trim();

function renderPostgresInvokeBlockTs(toolCases: string, flags: InvokeParamHelperFlags): string {
    const helpers = [
        flags.postgresNumeric ? POSTGRES_NUMERIC_HELPER_TS : '',
        flags.postgresBoolean ? POSTGRES_BOOLEAN_HELPER_TS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = helpers.length > 0 ? `\n\n${helpers}` : '';
    return `
import pg from 'pg';

export const DEFAULT_PAGE_LIMIT = ${DEFAULT_PAGE_LIMIT};
export const DEFAULT_MAX_LIMIT_CAP = ${DEFAULT_MAX_LIMIT_CAP};

export type InvokeOptions = Record<string, unknown> & {
    limit?: number;
    offset?: number;
};

function resolveConnectionString(hostContext: unknown): string {
    if (hostContext && typeof hostContext === 'object' && 'connectionString' in hostContext) {
        const cs = (hostContext as { connectionString?: unknown }).connectionString;
        if (cs !== undefined && cs !== null && String(cs).trim().length > 0) {
            return String(cs).trim();
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}${helperSection}

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
    hostContext?: unknown
): Promise<unknown> {
    const connectionString = resolveConnectionString(hostContext);
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
${toolCases}
            default:
                throw new Error(\`Unknown tool: \${toolName}\`);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderPostgresInvokeBlockJs(toolCases: string, flags: InvokeParamHelperFlags): string {
    const helpers = [
        flags.postgresNumeric ? POSTGRES_NUMERIC_HELPER_JS : '',
        flags.postgresBoolean ? POSTGRES_BOOLEAN_HELPER_JS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = helpers.length > 0 ? `\n\n${helpers}` : '';
    return `
import pg from 'pg';

export const DEFAULT_PAGE_LIMIT = ${DEFAULT_PAGE_LIMIT};
export const DEFAULT_MAX_LIMIT_CAP = ${DEFAULT_MAX_LIMIT_CAP};

function resolveConnectionString(hostContext) {
    if (hostContext && typeof hostContext === 'object' && hostContext.connectionString != null) {
        const cs = String(hostContext.connectionString).trim();
        if (cs.length > 0) {
            return cs;
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}${helperSection}

export async function invokeTool(toolName, options = {}, hostContext) {
    const connectionString = resolveConnectionString(hostContext);
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
${toolCases}
            default:
                throw new Error(\`Unknown tool: \${toolName}\`);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderMysqlInvokeBlockTs(toolCases: string, flags: InvokeParamHelperFlags): string {
    const helperSection = flags.mysqlBoolean ? `\n\n${MYSQL_BOOLEAN_HELPER_TS}` : '';
    return `
import mysql from 'mysql2/promise';

export const DEFAULT_PAGE_LIMIT = ${DEFAULT_PAGE_LIMIT};
export const DEFAULT_MAX_LIMIT_CAP = ${DEFAULT_MAX_LIMIT_CAP};

export type InvokeOptions = Record<string, unknown> & {
    limit?: number;
    offset?: number;
};

function resolveConnectionString(hostContext: unknown): string {
    if (hostContext && typeof hostContext === 'object' && 'connectionString' in hostContext) {
        const cs = (hostContext as { connectionString?: unknown }).connectionString;
        if (cs !== undefined && cs !== null && String(cs).trim().length > 0) {
            return String(cs).trim();
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function normalizeMysqlRows(rows: unknown): unknown[] {
    return Array.isArray(rows) ? rows : [];
}

function normalizeMysqlParamValue(value: unknown): string | number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const text = String(value);
    const trimmed = text.trim();
    if (/^-?\\d+(?:\\.\\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }
    return text;
}${helperSection}

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
    hostContext?: unknown
): Promise<unknown> {
    const connectionString = resolveConnectionString(hostContext);
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {
${toolCases}
            default:
                throw new Error(\`Unknown tool: \${toolName}\`);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderMysqlInvokeBlockJs(toolCases: string, flags: InvokeParamHelperFlags): string {
    const helperSection = flags.mysqlBoolean ? `\n\n${MYSQL_BOOLEAN_HELPER_JS}` : '';
    return `
import mysql from 'mysql2/promise';

export const DEFAULT_PAGE_LIMIT = ${DEFAULT_PAGE_LIMIT};
export const DEFAULT_MAX_LIMIT_CAP = ${DEFAULT_MAX_LIMIT_CAP};

function resolveConnectionString(hostContext) {
    if (hostContext && typeof hostContext === 'object' && hostContext.connectionString != null) {
        const cs = String(hostContext.connectionString).trim();
        if (cs.length > 0) {
            return cs;
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function normalizeMysqlRows(rows) {
    return Array.isArray(rows) ? rows : [];
}

function normalizeMysqlParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const text = String(value);
    const trimmed = text.trim();
    if (/^-?\\d+(?:\\.\\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }
    return text;
}${helperSection}

export async function invokeTool(toolName, options = {}, hostContext) {
    const connectionString = resolveConnectionString(hostContext);
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {
${toolCases}
            default:
                throw new Error(\`Unknown tool: \${toolName}\`);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

export function renderInvokeBlockTs(tools: ResolvedDbToolCodegen[], dialect: ResolvedDatabaseDialect): string {
    const toolCases = renderInvokeSwitchCases(tools, dialect);
    const flags = resolveInvokeParamHelperFlags(tools);
    return dialect === 'mysql'
        ? renderMysqlInvokeBlockTs(toolCases, flags)
        : renderPostgresInvokeBlockTs(toolCases, flags);
}

export function renderInvokeBlockJs(tools: ResolvedDbToolCodegen[], dialect: ResolvedDatabaseDialect): string {
    const toolCases = renderInvokeSwitchCases(tools, dialect);
    const flags = resolveInvokeParamHelperFlags(tools);
    return dialect === 'mysql'
        ? renderMysqlInvokeBlockJs(toolCases, flags)
        : renderPostgresInvokeBlockJs(toolCases, flags);
}
