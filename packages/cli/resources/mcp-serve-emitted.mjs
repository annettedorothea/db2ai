#!/usr/bin/env node

// node_modules/@core2ai/core/packages/mcp-host/out/mcp-standalone-entry.js
import * as path2 from "node:path";
import { pathToFileURL } from "node:url";

// node_modules/@core2ai/core/packages/mcp-host/out/env.js
import * as fs from "node:fs";
import * as path from "node:path";
var LOCAL_ENV_FILES = [".env", ".env.local"];
function stripOptionalQuotes(value) {
  if (value.length < 2) {
    return value;
  }
  const first = value.at(0);
  const last = value.at(-1);
  if (first === '"' && last === '"' || first === "'" && last === "'") {
    return value.slice(1, -1);
  }
  return value;
}
function parseEnvLine(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return void 0;
  }
  const assignment = trimmed.startsWith("export ") ? trimmed.slice("export ".length).trim() : trimmed;
  const separator = assignment.indexOf("=");
  if (separator <= 0) {
    return void 0;
  }
  const key = assignment.slice(0, separator).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return void 0;
  }
  const value = stripOptionalQuotes(assignment.slice(separator + 1).trim());
  return [key, value];
}
function ancestorDirectories(startDir) {
  const directories = [];
  let current = path.resolve(startDir);
  while (true) {
    directories.unshift(current);
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return directories;
}
function loadLocalEnvFiles(startDirs) {
  const protectedKeys = new Set(Object.keys(process.env));
  const loadedKeys = /* @__PURE__ */ new Set();
  const loadedFiles = [];
  const visitedFiles = /* @__PURE__ */ new Set();
  for (const startDir of startDirs) {
    for (const directory of ancestorDirectories(startDir)) {
      for (const fileName of LOCAL_ENV_FILES) {
        const filePath = path.join(directory, fileName);
        if (visitedFiles.has(filePath) || !fs.existsSync(filePath)) {
          continue;
        }
        visitedFiles.add(filePath);
        const content = fs.readFileSync(filePath, "utf-8");
        const overrideExisting = fileName === ".env.local";
        for (const line of content.split(/\r?\n/u)) {
          const parsed = parseEnvLine(line);
          if (!parsed) {
            continue;
          }
          const [key, value] = parsed;
          if (overrideExisting || !protectedKeys.has(key) || loadedKeys.has(key)) {
            process.env[key] = value;
            loadedKeys.add(key);
          }
        }
        loadedFiles.push(filePath);
      }
    }
  }
  return loadedFiles;
}

// node_modules/@core2ai/core/packages/mcp-host/out/mcp-host-adapter.js
function readMcpHostAdapter(imported2) {
  const adapter = imported2.mcpHostAdapter;
  if (!adapter || typeof adapter !== "object") {
    throw new Error('Generated module must export "mcpHostAdapter". Regenerate tool code.');
  }
  const a = adapter;
  if (typeof a.configureFromArgv !== "function") {
    throw new Error("mcpHostAdapter.configureFromArgv is required. Regenerate tool code.");
  }
  if (typeof a.validateAtStartup !== "function") {
    throw new Error("mcpHostAdapter.validateAtStartup is required. Regenerate tool code.");
  }
  if (typeof a.resolveHostContext !== "function") {
    throw new Error("mcpHostAdapter.resolveHostContext is required. Regenerate tool code.");
  }
  if (typeof a.envDirsForReload !== "function") {
    throw new Error("mcpHostAdapter.envDirsForReload is required. Regenerate tool code.");
  }
  return a;
}
function readGeneratedModule(imported2) {
  const generatedTools = imported2.generatedTools;
  const invokeTool = imported2.invokeTool;
  if (!Array.isArray(generatedTools)) {
    throw new Error('Generated module must export "generatedTools" array.');
  }
  if (typeof invokeTool !== "function") {
    throw new Error('Generated module must export async "invokeTool" function.');
  }
  const inputZodByTool = imported2.inputZodByTool;
  const mcpServerName = imported2.mcpServerName;
  const mcpServerVersion = imported2.mcpServerVersion;
  return {
    adapter: readMcpHostAdapter(imported2),
    generatedTools,
    invokeTool,
    inputZodByTool: inputZodByTool && typeof inputZodByTool === "object" && !Array.isArray(inputZodByTool) ? inputZodByTool : void 0,
    mcpServerName: typeof mcpServerName === "string" ? mcpServerName : void 0,
    mcpServerVersion: typeof mcpServerVersion === "string" ? mcpServerVersion : void 0,
    requiresAuth: imported2.requiresAuth === true
  };
}

// node_modules/@core2ai/core/packages/mcp-host/out/mcp-server.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
function requireMcpServerIdentity(generated2) {
  const name = generated2.mcpServerName?.trim();
  const version = generated2.mcpServerVersion?.trim();
  if (!name) {
    throw new Error('Generated module must export "mcpServerName". Regenerate tool code.');
  }
  if (!version) {
    throw new Error('Generated module must export "mcpServerVersion". Regenerate tool code.');
  }
  return { name, version };
}
function requireInputZodSchema(inputZodByTool, toolName) {
  if (!inputZodByTool) {
    throw new Error('Generated module must export "inputZodByTool". Regenerate tool code.');
  }
  const schema = inputZodByTool[toolName];
  if (!schema || typeof schema !== "object") {
    throw new Error(`Generated module inputZodByTool has no schema for tool "${toolName}". Regenerate tool code.`);
  }
  return schema;
}
function reloadEnvFilesForDev(generated2) {
  const dirs = generated2.adapter.envDirsForReload();
  if (dirs.length > 0) {
    loadLocalEnvFiles(dirs);
  }
}
async function runMcpServer(generated2) {
  const { name, version } = requireMcpServerIdentity(generated2);
  const server = new McpServer({ name, version });
  for (const tool of generated2.generatedTools) {
    const inputSchema = requireInputZodSchema(generated2.inputZodByTool, tool.toolName);
    server.registerTool(tool.toolName, {
      title: typeof tool.title === "string" && tool.title.length > 0 ? tool.title : void 0,
      description: tool.description,
      inputSchema
    }, async (args) => {
      reloadEnvFilesForDev(generated2);
      const hostContext = generated2.adapter.resolveHostContext();
      const result = await generated2.invokeTool(tool.toolName, args ?? {}, hostContext);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    });
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// node_modules/@core2ai/core/packages/mcp-host/out/mcp-standalone-entry.js
var argv = process.argv.slice(2);
var modulePath = argv[0];
if (!modulePath) {
  throw new Error("Usage: node mcp-serve.mjs <path-to-*-tools.mjs> [host options...]");
}
var envDirs = [process.cwd(), path2.dirname(path2.resolve(modulePath))];
loadLocalEnvFiles(envDirs);
var imported = await import(pathToFileURL(path2.resolve(modulePath)).href);
if (!imported || typeof imported !== "object") {
  throw new Error(`Generated module "${modulePath}" did not export an object.`);
}
var generated = readGeneratedModule(imported);
generated.adapter.configureFromArgv(argv.slice(1), envDirs);
generated.adapter.validateAtStartup(generated.requiresAuth === true);
console.error("[mcp] host context refreshed each tool call");
await runMcpServer(generated);
