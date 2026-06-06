// @generated from @core2ai/core — do not edit; regenerate via npm run generate:all in a demo workspace with demos-generate.config.json.

export { readGeneratedToolModule, type GeneratedToolDescriptor, type GeneratedToolModule } from './generated-module.js';
export { compileGeneratedForSmoke } from './compile-generated-fixture.js';
export {
    connectMcpStdio,
    withMcpStdioSession,
    type McpStdioConnectOptions,
    type McpStdioSession
} from './mcp-stdio-smoke.js';
export {
    connectMcpStatelessHttp,
    withMcpStatelessHttpSession,
    type McpStatelessHttpConnectOptions,
    type McpStatelessHttpSession
} from './mcp-http-smoke.js';
export { asRecord, credentialWithOptionalJwt, restoreEnv } from './env-helpers.js';
