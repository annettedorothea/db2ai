import { describe, expect, it } from 'vitest';
import { renderMcpServerTemplate } from '@toolfactory.dev/core/codegen';
import {
    renderPassthroughHttpRuntimeCompose,
    renderPublicHttpRuntimeCompose
} from '../src/codegen/templates/http-runtime.compose.js';
import { renderOAuthHttpRuntimeCompose } from '../src/codegen/templates/oauth-http-runtime.compose.js';
import { renderStdioRuntimeCompose } from '../src/codegen/templates/stdio-runtime.compose.js';

const LOGGING_IMPORT = '../../../src/utils/logging-adapter.js';

describe('db2ai MCP runtime compose snapshots', () => {
    it('stdio-runtime', () => {
        expect(renderStdioRuntimeCompose(LOGGING_IMPORT)).toMatchSnapshot();
    });

    it('public-http-runtime', () => {
        expect(renderPublicHttpRuntimeCompose(LOGGING_IMPORT)).toMatchSnapshot();
    });

    it('passthrough-http-runtime', () => {
        expect(renderPassthroughHttpRuntimeCompose(LOGGING_IMPORT)).toMatchSnapshot();
    });

    it('oauth-http-runtime', () => {
        expect(renderOAuthHttpRuntimeCompose(LOGGING_IMPORT)).toMatchSnapshot();
    });
});

describe('db2ai MCP server compose snapshots', () => {
    it('stdio-mcp-server', () => {
        expect(
            renderMcpServerTemplate({
                hostKind: 'stdio',
                moduleBasename: 'postgres',
                toolsImport: '../tools/postgres-tools.js',
                runtimeImport: '../cli/stdio-runtime.js'
            })
        ).toMatchSnapshot();
    });

    it('public-http-mcp-server', () => {
        expect(
            renderMcpServerTemplate({
                hostKind: 'public-http',
                moduleBasename: 'postgres',
                toolsImport: '../tools/postgres-tools.js',
                runtimeImport: '../cli/public-http-runtime.js'
            })
        ).toMatchSnapshot();
    });

    it('passthrough-http-mcp-server', () => {
        expect(
            renderMcpServerTemplate({
                hostKind: 'passthrough-http',
                moduleBasename: 'postgres',
                toolsImport: '../tools/postgres-tools.js',
                runtimeImport: '../cli/passthrough-http-runtime.js'
            })
        ).toMatchSnapshot();
    });

    it('oauth-http-mcp-server', () => {
        expect(
            renderMcpServerTemplate({
                hostKind: 'oauth-http',
                moduleBasename: 'postgres',
                toolsImport: '../tools/postgres-tools.js',
                runtimeImport: '../cli/oauth-http-runtime.js'
            })
        ).toMatchSnapshot();
    });
});
