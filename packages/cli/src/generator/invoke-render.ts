import { DEFAULT_MAX_LIMIT_CAP, DEFAULT_PAGE_LIMIT, type ResolvedDatabaseDialect } from 'db-2-ai-dsl-language';
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

function renderOptionValueExpression(propertyName: string, dialect: ResolvedDatabaseDialect): string {
    const optionAccess = `options[${JSON.stringify(propertyName)}]`;
    if (dialect === 'mysql') {
        return `normalizeMysqlParamValue(${optionAccess})`;
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

function resolveMysqlParamValueExpressions(tool: ResolvedSqlToolCodegen): string[] {
    const paramsByPlaceholder = new Map(tool.params.map((p) => [p.placeholder, p]));
    return Array.from(tool.sqlText.matchAll(/\$[0-9]+/g), (match) => {
        const placeholder = match[0];
        const param = paramsByPlaceholder.get(placeholder);
        if (!param) {
            throw new Error(`Codegen: SQL query references ${placeholder}, but no matching param was resolved.`);
        }
        return renderOptionValueExpression(param.propertyName, 'mysql');
    });
}

function renderSqlInvokeCase(tool: ResolvedSqlToolCodegen, dialect: ResolvedDatabaseDialect): string {
    const valueExprs = (
        dialect === 'mysql'
            ? resolveMysqlParamValueExpressions(tool)
            : tool.params.map((p) => renderOptionValueExpression(p.propertyName, dialect))
    ).join(', ');
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

function renderInvokeSwitchCases(tools: ResolvedDbToolCodegen[], dialect: ResolvedDatabaseDialect): string {
    return tools
        .map((tool) =>
            tool.kind === 'table' ? renderTableInvokeCase(tool, dialect) : renderSqlInvokeCase(tool, dialect)
        )
        .join('\n');
}

function renderPostgresInvokeBlockTs(toolCases: string): string {
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
}

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

function renderPostgresInvokeBlockJs(toolCases: string): string {
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
}

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

function renderMysqlInvokeBlockTs(toolCases: string): string {
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
}

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

function renderMysqlInvokeBlockJs(toolCases: string): string {
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
}

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
    return dialect === 'mysql' ? renderMysqlInvokeBlockTs(toolCases) : renderPostgresInvokeBlockTs(toolCases);
}

export function renderInvokeBlockJs(tools: ResolvedDbToolCodegen[], dialect: ResolvedDatabaseDialect): string {
    const toolCases = renderInvokeSwitchCases(tools, dialect);
    return dialect === 'mysql' ? renderMysqlInvokeBlockJs(toolCases) : renderPostgresInvokeBlockJs(toolCases);
}
