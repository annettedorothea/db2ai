#!/usr/bin/env node
/**
 * Generated MCP passthrough-http host for plants-oracle (static tools import).
 */
import * as tools from '../tools/plants-oracle-tools.js';
import { runPassthroughHttpMcp } from '../cli/passthrough-http-runtime.js';

await runPassthroughHttpMcp(tools, process.argv.slice(2));
