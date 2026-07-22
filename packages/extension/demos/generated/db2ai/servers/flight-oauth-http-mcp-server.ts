#!/usr/bin/env node
/**
 * Generated MCP oauth-http host for flight (static tools import).
 */
import * as tools from '../tools/flight-tools.js';
import { runOAuthHttpMcp } from '../cli/oauth-http-runtime.js';

await runOAuthHttpMcp(tools, process.argv.slice(2));
