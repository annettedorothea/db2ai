#!/usr/bin/env node
/**
 * Generated MCP oauth-http host for sakila-mariadb (static tools import).
 */
import * as tools from '../tools/sakila-mariadb-tools.js';
import { runOAuthHttpMcp } from '../cli/oauth-http-runtime.js';

await runOAuthHttpMcp(tools, process.argv.slice(2));
