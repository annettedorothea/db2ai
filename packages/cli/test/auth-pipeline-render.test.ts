import { describe, expect, test } from 'vitest';
import { renderInvokeAuthPipeline } from '../src/codegen/auth-pipeline-render.js';

describe('renderInvokeAuthPipeline', () => {
    test('full tier uses toolMeta and omits url preamble', () => {
        const pipeline = renderInvokeAuthPipeline('full', false, {
            checkToolAccess: true,
            prepareToolCall: true
        });
        expect(pipeline).toContain('toolMeta.access');
        expect(pipeline).toContain('toolMeta.hasCheckToolAccess');
        expect(pipeline).not.toContain('normalizedBaseUrl');
        expect(pipeline).not.toContain('authCredential');
    });
});
