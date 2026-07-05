#!/usr/bin/env node
/**
 * Generated MCP stdio host for sakila-mysql (static tools import).
 */
import * as tools from '../tools/sakila-mysql-tools.js';
import { runStdioMcp } from '../cli/stdio-runtime.js';

await runStdioMcp(tools, process.argv.slice(2));
