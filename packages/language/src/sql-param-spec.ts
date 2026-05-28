import type { SqlParamSpec, SqlParamSpecField, SqlParamType } from './generated/ast.js';
import { isSqlParamSpecField } from './generated/ast.js';

export const RESERVED_SQL_PARAM_NAMES = new Set(['limit', 'offset']);

export type ParsedSqlParamSpec = {
    name?: string;
    description?: string;
    example?: string;
    paramType: SqlParamType;
};

export function parseSqlParamSpec(spec: SqlParamSpec | undefined): ParsedSqlParamSpec {
    const out: ParsedSqlParamSpec = { paramType: 'string' };
    if (!spec) {
        return out;
    }
    for (const field of spec.fields) {
        if (!isSqlParamSpecField(field)) {
            continue;
        }
        if (field.name !== undefined && String(field.name).trim().length > 0) {
            out.name = String(field.name).trim();
        }
        if (field.description !== undefined) {
            out.description = String(field.description);
        }
        if (field.example !== undefined) {
            out.example = String(field.example);
        }
        if (field.paramType !== undefined) {
            out.paramType = field.paramType;
        }
    }
    return out;
}

export function fieldKind(field: SqlParamSpecField): 'name' | 'description' | 'example' | 'type' | undefined {
    if (field.name !== undefined) {
        return 'name';
    }
    if (field.description !== undefined) {
        return 'description';
    }
    if (field.example !== undefined) {
        return 'example';
    }
    if (field.paramType !== undefined) {
        return 'type';
    }
    return undefined;
}

export function usedSqlParamSpecFieldKinds(spec: SqlParamSpec | undefined): Set<string> {
    const used = new Set<string>();
    if (!spec) {
        return used;
    }
    for (const field of spec.fields) {
        const kind = fieldKind(field);
        if (kind) {
            used.add(kind);
        }
    }
    return used;
}

export function parseExampleAsType(example: string, paramType: SqlParamType): string | undefined {
    const trimmed = example.trim();
    if (trimmed.length === 0) {
        return '`example` must not be empty.';
    }
    switch (paramType) {
        case 'string':
            return undefined;
        case 'integer': {
            const n = Number(trimmed);
            if (!Number.isInteger(n)) {
                return '`example` must be a valid integer for `type: integer`.';
            }
            return undefined;
        }
        case 'number': {
            const n = Number(trimmed);
            if (!Number.isFinite(n)) {
                return '`example` must be a valid number for `type: number`.';
            }
            return undefined;
        }
        case 'boolean': {
            const lower = trimmed.toLowerCase();
            if (lower !== 'true' && lower !== 'false') {
                return '`example` must be "true" or "false" for `type: boolean`.';
            }
            return undefined;
        }
        default:
            return undefined;
    }
}

export function coerceExampleValue(example: string, paramType: SqlParamType): string | number | boolean {
    const trimmed = example.trim();
    switch (paramType) {
        case 'integer':
            return Number.parseInt(trimmed, 10);
        case 'number':
            return Number(trimmed);
        case 'boolean':
            return trimmed.toLowerCase() === 'true';
        default:
            return trimmed;
    }
}

export function jsonSchemaExampleValue(example: string, paramType: SqlParamType): string | number | boolean {
    return coerceExampleValue(example, paramType);
}
