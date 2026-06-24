import type { Reference } from 'langium';
import type { SqlParamEntry, SqlQuery } from './generated/ast.js';
import { isAuthorizeTrue, isProtectedAccess, isPublicAccess, isPrepareBody, isPrepareTrue } from './generated/ast.js';

export function getAccessKind(query: SqlQuery): 'public' | 'protected' {
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
    throw new Error('SqlQuery is missing access.');
}

export function isToolAuthorizeEnabled(query: SqlQuery): boolean {
    const authorize = query.authorize;
    if (!authorize) {
        return false;
    }
    return isAuthorizeTrue(authorize);
}

export function isToolPrepareEnabled(query: SqlQuery): boolean {
    const prepare = query.prepare;
    if (!prepare) {
        return false;
    }
    return isPrepareTrue(prepare) || isPrepareBody(prepare);
}

/** @deprecated Use isToolPrepareEnabled */
export const isToolValidateEnabled = isToolPrepareEnabled;

export function resolveOptionalParamRef(ref: Reference<SqlParamEntry>): string {
    const key = ref.ref?.key;
    if (key !== undefined && String(key).trim().length > 0) {
        return String(key).trim();
    }
    return ref.$refText?.trim() ?? '';
}

export function getOptionalParams(query: SqlQuery): readonly string[] {
    const prepare = query.prepare;
    if (isPrepareBody(prepare) && prepare.optionalParams) {
        return prepare.optionalParams
            .map((ref) => resolveOptionalParamRef(ref).trim())
            .filter((name) => name.length > 0);
    }
    return [];
}

export function accessRequiresAuth(query: SqlQuery): boolean {
    if (!query.access) {
        return false;
    }
    return getAccessKind(query) === 'protected';
}
