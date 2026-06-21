import type { Reference } from 'langium';
import type { SqlParamEntry, SqlQuery } from './generated/ast.js';
import { isAuthorizeTrue, isProtectedAccess, isPublicAccess, isValidateBody, isValidateTrue } from './generated/ast.js';

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

export function isToolValidateEnabled(query: SqlQuery): boolean {
    const validate = query.validate;
    if (!validate) {
        return false;
    }
    return isValidateTrue(validate) || isValidateBody(validate);
}

export function resolveOptionalParamRef(ref: Reference<SqlParamEntry>): string {
    const key = ref.ref?.key;
    if (key !== undefined && String(key).trim().length > 0) {
        return String(key).trim();
    }
    return ref.$refText?.trim() ?? '';
}

export function getOptionalParams(query: SqlQuery): readonly string[] {
    const validate = query.validate;
    if (isValidateBody(validate) && validate.optionalParams) {
        return validate.optionalParams
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
