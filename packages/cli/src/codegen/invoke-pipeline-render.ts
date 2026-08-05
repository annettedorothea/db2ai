import {
    missingCredentialErrorSnippet,
    renderCheckToolAccessBlock,
    renderPrepareToolCallBlock,
    renderVerifyCredentialBlock
} from '@toolfactory.dev/core/codegen';
import type { InvokePipelineTier, HookStubMaps } from '@toolfactory.dev/core/codegen';

function renderInvokeCredentialPipeline(hasVerifyCredential: boolean): string {
    const verifyBlock = renderVerifyCredentialBlock(hasVerifyCredential, 'String(inbound).trim()');
    return `
    if (toolMeta.access === 'protected') {
        const inbound = host.credential;
        if (!inbound || !String(inbound).trim()) {${missingCredentialErrorSnippet()}
        }${verifyBlock}
    }`;
}

/** Emits auth / hook preamble inside generated db2ai invokeTool. */
export function renderInvokePipeline(
    tier: InvokePipelineTier,
    hasVerifyCredential: boolean,
    stubMaps: HookStubMaps
): string {
    if (tier === 'credential') {
        return renderInvokeCredentialPipeline(hasVerifyCredential);
    }
    if (tier !== 'full') {
        throw new Error('renderInvokePipeline: tier must be credential or full');
    }

    const verifyBlock = renderVerifyCredentialBlock(hasVerifyCredential, 'credential');
    const checkToolAccessBlock = renderCheckToolAccessBlock(stubMaps, 'toolMeta');
    const prepareBlock = renderPrepareToolCallBlock(stubMaps, 'toolMeta');

    return `
    let credential: string | undefined = host.credential?.trim()
        ? String(host.credential).trim()
        : undefined;

    if (toolMeta.access === 'protected') {
        const inbound = host.credential;
        if (!inbound || !String(inbound).trim()) {${missingCredentialErrorSnippet()}
        }
        credential = String(inbound).trim();${verifyBlock}${checkToolAccessBlock}
    }${prepareBlock}`;
}

export type { InvokePipelineTier, HookStubMaps };
