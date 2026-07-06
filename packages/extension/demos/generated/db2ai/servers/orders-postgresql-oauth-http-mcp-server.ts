#!/usr/bin/env node
/**
 * Generated MCP oauth-http host for orders-postgresql (static tools import).
 */
import * as tools from '../tools/orders-postgresql-tools.js';
import { runOAuthHttpMcp } from '../cli/oauth-http-runtime.js';

await runOAuthHttpMcp(tools, process.argv.slice(2));
