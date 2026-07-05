#!/usr/bin/env node
/**
 * Generated MCP public-http host for orders-postgresql (static tools import).
 */
import * as tools from '../tools/orders-postgresql-tools.js';
import { runPublicHttpMcp } from '../cli/public-http-runtime.js';

await runPublicHttpMcp(tools, process.argv.slice(2));
