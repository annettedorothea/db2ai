#!/usr/bin/env node
/**
 * Generated MCP stdio host for animals-sqlserver (static tools import).
 */
import * as tools from '../tools/animals-sqlserver-tools.js';
import { runStdioMcp } from '../cli/stdio-runtime.js';

await runStdioMcp(tools, process.argv.slice(2));
