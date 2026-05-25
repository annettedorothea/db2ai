import { DEFAULT_MAX_LIMIT_CAP, DEFAULT_PAGE_LIMIT } from 'db-2-ai-dsl-language';
import {
    quotePostgresIdent,
    type ResolvedDbToolCodegen,
    type ResolvedSqlToolCodegen,
    type ResolvedTableToolCodegen
} from '../db-query-codegen.js';

function renderTableInvokeCase(tool: ResolvedTableToolCodegen): string {
    const quotedTable = quotePostgresIdent(tool.table);
    return `        case ${JSON.stringify(tool.toolName)}: {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
                ${tool.maxLimitCap}
            );
            const offset =
                typeof options.offset === 'number' && Number.isFinite(options.offset) && options.offset >= 0
                    ? Math.floor(options.offset)
                    : 0;
            const sql = \`SELECT * FROM ${quotedTable} LIMIT $1 OFFSET $2\`;
            const result = await client.query(sql, [effectiveLimit, offset]);
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length,
                limit: effectiveLimit,
                offset
            };
        }`;
}

function renderSqlInvokeCase(tool: ResolvedSqlToolCodegen): string {
    const valueExprs = tool.params
        .map(
            p =>
                `options[${JSON.stringify(p.propertyName)}] !== undefined && options[${JSON.stringify(p.propertyName)}] !== null ? String(options[${JSON.stringify(p.propertyName)}]) : null`
        )
        .join(', ');
    return `        case ${JSON.stringify(tool.toolName)}: {
            const result = await client.query({ text: ${JSON.stringify(tool.sqlText)}, values: [${valueExprs}] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }`;
}

function renderInvokeSwitchCases(tools: ResolvedDbToolCodegen[]): string {
    return tools
        .map(tool => (tool.kind === 'table' ? renderTableInvokeCase(tool) : renderSqlInvokeCase(tool)))
        .join('\n');
}

export function renderInvokeBlockTs(tools: ResolvedDbToolCodegen[]): string {
    const toolCases = renderInvokeSwitchCases(tools);
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

export function renderInvokeBlockJs(tools: ResolvedDbToolCodegen[]): string {
    const toolCases = renderInvokeSwitchCases(tools);
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
