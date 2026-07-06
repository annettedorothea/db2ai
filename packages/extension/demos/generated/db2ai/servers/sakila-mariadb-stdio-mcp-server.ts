#!/usr/bin/env node
/**
 * Generated MCP stdio host for sakila-mariadb (static tools import).
 */
import * as tools from '../tools/sakila-mariadb-tools.js';
import { runStdioMcp } from '../cli/stdio-runtime.js';

await runStdioMcp(tools, process.argv.slice(2));
