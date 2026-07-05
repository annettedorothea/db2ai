#!/usr/bin/env node
/**
 * Generated MCP passthrough-http host for orders-postgresql (static tools import).
 */
import * as tools from '../tools/orders-postgresql-tools.js';
import { runPassthroughHttpMcp } from '../cli/passthrough-http-runtime.js';

await runPassthroughHttpMcp(tools, process.argv.slice(2));
