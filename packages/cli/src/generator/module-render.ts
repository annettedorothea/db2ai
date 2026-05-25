import * as path from 'node:path';
import type { ResolvedDbToolCodegen } from '../db-query-codegen.js';

function serializeJsonForModule(value: unknown): string {
    return JSON.stringify(value, null, 4);
}

function renderSourceReference(source: string): string {
    return path.basename(source);
}

export function renderMcpServerIdentityExports(name: string, version: string): string {
    return `export const mcpServerName = ${JSON.stringify(name)};
export const mcpServerVersion = ${JSON.stringify(version)};
`;
}

export function renderTsModule(
    tools: ResolvedDbToolCodegen[],
    connectionEnv: string,
    mcpServerIdentityBlock: string,
    toolRuntimeBlock: string,
    source: string
): string {
    const toolsLiteral = serializeJsonForModule(tools);
    const sourceRef = renderSourceReference(source);
    return `/**
 * Generated from: ${sourceRef}
 */

export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const requiresAuth = false;

export type GeneratedTool = {
    toolName: string;
    title: string;
    description: string;
    kind: 'table' | 'sql';
    table?: string;
    maxLimitCap?: number;
    sqlText?: string;
    example?: string;
};

export const generatedTools: GeneratedTool[] = ${toolsLiteral};

${mcpServerIdentityBlock}
${toolRuntimeBlock}
`;
}

export function renderJsModule(
    tools: ResolvedDbToolCodegen[],
    connectionEnv: string,
    mcpServerIdentityBlock: string,
    toolRuntimeBlock: string,
    source: string
): string {
    const sourceRef = renderSourceReference(source);
    return `/**
 * Generated from: ${sourceRef}
 */

export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const requiresAuth = false;

export const generatedTools = ${serializeJsonForModule(tools)};

${mcpServerIdentityBlock}
${toolRuntimeBlock}
`;
}
