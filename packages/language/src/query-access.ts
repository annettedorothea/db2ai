import type { Reference } from 'langium';
import type { Model, SqlParamEntry, SqlQuery } from './generated/ast.js';
import {
    isAuthBlock,
    isBareAuth,
    isPrepareToolCallBody,
    isPrepareToolCallTrue,
    isProtectedAccess,
    isPublicAccess
} from './generated/ast.js';

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

export function isModelAuthEnabled(model: Model): boolean {
    return model.auth !== undefined;
}

export function isVerifyCredentialEnabled(model: Model): boolean {
    const auth = model.auth;
    if (!auth) {
        return false;
    }
    if (isBareAuth(auth)) {
        return true;
    }
    if (isAuthBlock(auth)) {
        return auth.hooks?.verifyCredential === true;
    }
    return false;
}

export function isCheckToolAccessEnabled(query: SqlQuery): boolean {
    return query.hooks?.checkToolAccess === true;
}

export function isPrepareToolCallEnabled(query: SqlQuery): boolean {
    const spec = query.hooks?.prepareToolCall;
    if (!spec) {
        return false;
    }
    return isPrepareToolCallTrue(spec) || isPrepareToolCallBody(spec);
}

export function resolveClientMayOmitRef(ref: Reference<SqlParamEntry>): string {
    const key = ref.ref?.key;
    if (key !== undefined && String(key).trim().length > 0) {
        return String(key).trim();
    }
    return ref.$refText?.trim() ?? '';
}

export function getClientMayOmit(query: SqlQuery): readonly string[] {
    const spec = query.hooks?.prepareToolCall;
    if (isPrepareToolCallBody(spec) && spec.clientMayOmit) {
        return spec.clientMayOmit.map((ref) => resolveClientMayOmitRef(ref).trim()).filter((name) => name.length > 0);
    }
    return [];
}

export function accessRequiresAuth(query: SqlQuery): boolean {
    if (!query.access) {
        return false;
    }
    return getAccessKind(query) === 'protected';
}
