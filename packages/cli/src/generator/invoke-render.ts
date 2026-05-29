import type { ResolvedDatabaseDialect, SqlParamType } from 'db-2-ai-dsl-language';
import type { ResolvedDbToolCodegen, ResolvedSqlToolCodegen } from '../db-query-codegen.js';
import { renderInvokeCredentialAndParameterCheck } from './auth-stub-render.js';

function renderOptionValueExpression(
    propertyName: string,
    dialect: ResolvedDatabaseDialect,
    paramType: SqlParamType,
    optionsVar: string
): string {
    const optionAccess = `${optionsVar}[${JSON.stringify(propertyName)}]`;
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

function rewriteLogicalPlaceholdersForMysql(sqlText: string): string {
    return sqlText.replace(/\$[0-9]+/g, '?');
}

function renderSqlInvokeCase(
    tool: ResolvedSqlToolCodegen,
    dialect: ResolvedDatabaseDialect,
    optionsVar: string
): string {
    const paramsByPlaceholder = new Map(tool.params.map((p) => [p.placeholder, p]));
    const orderedExprs = Array.from(tool.sqlText.matchAll(/\$[0-9]+/g), (match) => {
        const param = paramsByPlaceholder.get(match[0]);
        if (!param) {
            throw new Error(`Codegen: SQL query references ${match[0]}, but no matching param was resolved.`);
        }
        return renderOptionValueExpression(param.propertyName, dialect, param.jsonSchemaType, optionsVar);
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

function renderInvokeSwitchCases(
    tools: ResolvedDbToolCodegen[],
    dialect: ResolvedDatabaseDialect,
    optionsVar: string
): string {
    return tools.map((tool) => renderSqlInvokeCase(tool, dialect, optionsVar)).join('\n');
}

function renderHostBinding(typescript: boolean): string {
    if (typescript) {
        return `
    const host: DbHostContext =
        hostContext !== undefined
            ? (hostContext as DbHostContext)
            : mcpHostAdapter.resolveHostContext();`;
    }
    return `
    const host = hostContext ?? mcpHostAdapter.resolveHostContext();`;
}

function renderPostgresClientSetup(typescript: boolean): string {
    if (typescript) {
        return `
    const connectionString = resolveConnectionString(host);
    const client = new Client({ connectionString });
    await client.connect();`;
    }
    return `
    const connectionString = resolveConnectionString(host);
    const client = new pg.Client({ connectionString });
    await client.connect();`;
}

function renderInvokeToolPreamble(hasAuth: boolean, hasChecked: boolean, typescript: boolean): string {
    const accessChecks = renderInvokeCredentialAndParameterCheck(hasAuth, hasChecked);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
${renderHostBinding(typescript)}${accessChecks}${renderPostgresClientSetup(typescript)}
    try {
        switch (toolName) {`;
}

function renderInvokeToolPreambleMysql(hasAuth: boolean, hasChecked: boolean, typescript: boolean): string {
    const accessChecks = renderInvokeCredentialAndParameterCheck(hasAuth, hasChecked);
    return `
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
${renderHostBinding(typescript)}${accessChecks}
    const connectionString = resolveConnectionString(host);
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {`;
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

function renderPostgresInvokeBlockTs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreamble(hasAuth, hasChecked, true);
    const helpers = [
        flags.postgresNumeric ? POSTGRES_NUMERIC_HELPER_TS : '',
        flags.postgresBoolean ? POSTGRES_BOOLEAN_HELPER_TS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = helpers.length > 0 ? `\n\n${helpers}` : '';
    return `
import { Client } from 'pg';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}${helperSection}

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
    hostContext?: DbHostContext
): Promise<unknown> {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderPostgresInvokeBlockJs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreamble(hasAuth, hasChecked, false);
    const helpers = [
        flags.postgresNumeric ? POSTGRES_NUMERIC_HELPER_JS : '',
        flags.postgresBoolean ? POSTGRES_BOOLEAN_HELPER_JS : ''
    ]
        .filter((block) => block.length > 0)
        .join('\n\n');
    const helperSection = helpers.length > 0 ? `\n\n${helpers}` : '';
    return `
import pg from 'pg';

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

export async function invokeTool(toolName, options = {}, hostContext) {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderMysqlInvokeBlockTs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreambleMysql(hasAuth, hasChecked, true);
    const helperSection = flags.mysqlBoolean ? `\n\n${MYSQL_BOOLEAN_HELPER_TS}` : '';
    return `
import mysql from 'mysql2/promise';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
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
    hostContext?: DbHostContext
): Promise<unknown> {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderMysqlInvokeBlockJs(
    toolCases: string,
    flags: InvokeParamHelperFlags,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const preamble = renderInvokeToolPreambleMysql(hasAuth, hasChecked, false);
    const helperSection = flags.mysqlBoolean ? `\n\n${MYSQL_BOOLEAN_HELPER_JS}` : '';
    return `
import mysql from 'mysql2/promise';

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

export async function invokeTool(toolName, options = {}, hostContext) {${preamble}
${toolCases}
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

export function renderInvokeBlockTs(
    tools: ResolvedDbToolCodegen[],
    dialect: ResolvedDatabaseDialect,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const optionsVar = hasChecked ? 'optionsResolved' : 'options';
    const toolCases = renderInvokeSwitchCases(tools, dialect, optionsVar);
    const flags = resolveInvokeParamHelperFlags(tools);
    return dialect === 'mysql'
        ? renderMysqlInvokeBlockTs(toolCases, flags, hasAuth, hasChecked)
        : renderPostgresInvokeBlockTs(toolCases, flags, hasAuth, hasChecked);
}

export function renderInvokeBlockJs(
    tools: ResolvedDbToolCodegen[],
    dialect: ResolvedDatabaseDialect,
    hasAuth: boolean,
    hasChecked: boolean
): string {
    const optionsVar = hasChecked ? 'optionsResolved' : 'options';
    const toolCases = renderInvokeSwitchCases(tools, dialect, optionsVar);
    const flags = resolveInvokeParamHelperFlags(tools);
    return dialect === 'mysql'
        ? renderMysqlInvokeBlockJs(toolCases, flags, hasAuth, hasChecked)
        : renderPostgresInvokeBlockJs(toolCases, flags, hasAuth, hasChecked);
}
