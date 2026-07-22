#!/usr/bin/env node
/**
 * Generated MCP stdio host for sales-report (static tools import).
 */
import * as tools from '../tools/sales-report-tools.js';
import { runStdioMcp } from '../cli/stdio-runtime.js';

await runStdioMcp(tools, process.argv.slice(2));
