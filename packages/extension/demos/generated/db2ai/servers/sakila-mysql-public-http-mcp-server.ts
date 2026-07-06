#!/usr/bin/env node
/**
 * Generated MCP public-http host for sakila-mysql (static tools import).
 */
import * as tools from '../tools/sakila-mysql-tools.js';
import { runPublicHttpMcp } from '../cli/public-http-runtime.js';

await runPublicHttpMcp(tools, process.argv.slice(2));
