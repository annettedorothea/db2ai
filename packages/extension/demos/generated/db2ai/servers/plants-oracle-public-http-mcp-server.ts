#!/usr/bin/env node
/**
 * Generated MCP public-http host for plants-oracle (static tools import).
 */
import * as tools from '../tools/plants-oracle-tools.js';
import { runPublicHttpMcp } from '../cli/public-http-runtime.js';

await runPublicHttpMcp(tools, process.argv.slice(2));
