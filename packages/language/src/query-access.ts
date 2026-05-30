import type { Reference } from 'langium';
import type { SqlParamNameField, SqlQuery } from './generated/ast.js';
import { isCheckedAccess, isProtectedAccess, isPublicAccess } from './generated/ast.js';

export type AccessKind = 'public' | 'protected' | 'checked';

export function getAccessKind(query: SqlQuery): AccessKind {
    const access = query.access;
    if (!access) {
        throw new Error('SqlQuery is missing access.');
    }
    if (isPublicAccess(access)) {
        return 'public';
    }
    if (isProtectedAccess(access)) {
        return 'protected';
    }
    if (isCheckedAccess(access)) {
        return 'checked';
    }
    throw new Error('SqlQuery is missing access.');
}

export function resolveOptionalParamRef(ref: Reference<SqlParamNameField>): string {
    return ref.ref?.name ?? ref.$refText ?? '';
}

export function getOptionalParams(query: SqlQuery): readonly string[] {
    const access = query.access;
    if (isCheckedAccess(access) && access.checkedBody?.optionalParams) {
        return access.checkedBody.optionalParams
            .map((ref) => resolveOptionalParamRef(ref).trim())
            .filter((name) => name.length > 0);
    }
    return [];
}

export function accessRequiresAuth(query: SqlQuery): boolean {
    if (!query.access) {
        return false;
    }
    const kind = getAccessKind(query);
    return kind === 'protected' || kind === 'checked';
}
