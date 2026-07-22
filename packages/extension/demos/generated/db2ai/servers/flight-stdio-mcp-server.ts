#!/usr/bin/env node
/**
 * Generated MCP stdio host for flight (static tools import).
 */
import * as tools from '../tools/flight-tools.js';
import { runStdioMcp } from '../cli/stdio-runtime.js';

await runStdioMcp(tools, process.argv.slice(2));
