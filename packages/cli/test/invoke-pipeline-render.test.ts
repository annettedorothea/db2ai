import { describe, expect, test } from 'vitest';
import { renderInvokePipeline } from '../src/codegen/invoke-pipeline-render.js';

describe('renderInvokePipeline', () => {
    test('full tier uses toolMeta and omits url preamble', () => {
        const pipeline = renderInvokePipeline('full', false, {
            checkToolAccess: true,
            prepareToolCall: true,
            afterToolCall: false
        });
        expect(pipeline).toContain('toolMeta.access');
        expect(pipeline).toContain('toolMeta.hasCheckToolAccess');
        expect(pipeline).not.toContain('normalizedBaseUrl');
        expect(pipeline).not.toContain('authCredential');
    });
});
