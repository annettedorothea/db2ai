#!/usr/bin/env node
/**
 * Generated MCP passthrough-http host for sakila-mysql (static tools import).
 */
import * as tools from '../tools/sakila-mysql-tools.js';
import { runPassthroughHttpMcp } from '../cli/passthrough-http-runtime.js';

await runPassthroughHttpMcp(tools, process.argv.slice(2));
