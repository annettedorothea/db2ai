#!/usr/bin/env node
/**
 * Generated MCP stdio host for orders-postgresql (static tools import).
 */
import * as tools from '../tools/orders-postgresql-tools.js';
import { runStdioMcp } from '../cli/stdio-runtime.js';

await runStdioMcp(tools, process.argv.slice(2));
