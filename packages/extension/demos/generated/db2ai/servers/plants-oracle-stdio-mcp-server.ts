#!/usr/bin/env node
/**
 * Generated MCP stdio host for plants-oracle (static tools import).
 */
import * as tools from '../tools/plants-oracle-tools.js';
import { runStdioMcp } from '../cli/stdio-runtime.js';

await runStdioMcp(tools, process.argv.slice(2));
