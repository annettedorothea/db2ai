#!/usr/bin/env node

// packages/cli/mcp-bundle/mcp-standalone-entry.ts
import * as path3 from "node:path";

// packages/cli/src/env.ts
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
    if (!startDir || startDir.trim().length === 0) {
      continue;
    }
    for (const directory of ancestorDirectories(startDir)) {
      for (const fileName of LOCAL_ENV_FILES) {
        const filePath = path.join(directory, fileName);
        if (visitedFiles.has(filePath) || !fs.existsSync(filePath)) {
          continue;
        }
        visitedFiles.add(filePath);
        const content = fs.readFileSync(filePath, "utf-8");
        for (const line of content.split(/\r?\n/u)) {
          const parsed = parseEnvLine(line);
          if (!parsed) {
            continue;
          }
          const [key, value] = parsed;
          if (value.length === 0) {
            continue;
          }
          if (!protectedKeys.has(key) || loadedKeys.has(key)) {
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

// packages/cli/mcp-bundle/mcp-server.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as path2 from "node:path";
import { pathToFileURL } from "node:url";
import * as z from "zod/v4";
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function zodNumericPicklist(values) {
  if (values.length === 0) {
    return z.never();
  }
  if (values.length === 1) {
    return z.literal(values[0]);
  }
  const literals = values.map((v) => z.literal(v));
  return z.union(literals);
}
function jsonSchemaToZod(schema) {
  if (schema === null || typeof schema !== "object") {
    return z.unknown();
  }
  const s = schema;
  if (Array.isArray(s.anyOf)) {
    const parts = s.anyOf.map((p) => jsonSchemaToZod(p));
    if (parts.length === 0) {
      return z.never();
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return z.union(parts);
  }
  if (s.type === "object" && s.properties !== void 0 && typeof s.properties === "object" && !Array.isArray(s.properties)) {
    const props = s.properties;
    const required = new Set(
      Array.isArray(s.required) ? s.required.filter((x) => typeof x === "string") : []
    );
    const shape = {};
    for (const [key, propSchema] of Object.entries(props)) {
      let inner = jsonSchemaToZod(propSchema);
      if (!required.has(key)) {
        inner = inner.optional();
      }
      shape[key] = inner;
    }
    let obj = z.object(shape);
    if (s.additionalProperties === false) {
      obj = obj.strict();
    }
    return obj;
  }
  if (s.type === "array") {
    return z.array(jsonSchemaToZod(s.items));
  }
  if (s.type === "string") {
    return z.string();
  }
  if (s.type === "number" || s.type === "integer") {
    if (Array.isArray(s.enum) && s.enum.length >= 1 && s.enum.every(isFiniteNumber)) {
      return zodNumericPicklist(s.enum);
    }
    return z.number();
  }
  if (s.type === "boolean") {
    return z.boolean();
  }
  return z.unknown();
}
var fallbackInputSchema = z.object({
  limit: z.number().int().min(1).optional(),
  offset: z.number().int().min(0).optional()
}).strict();
function asLocalModulePath(modulePath) {
  if (modulePath.startsWith("file://")) {
    throw new Error("mcp-serve.mjs accepts local file paths only (no file:// URLs).");
  }
  return path2.resolve(modulePath);
}
function readRuntimeModule(imported) {
  const generatedTools = imported.generatedTools;
  const invokeTool = imported.invokeTool;
  if (!Array.isArray(generatedTools)) {
    throw new Error('Generated module must export "generatedTools" array.');
  }
  if (typeof invokeTool !== "function") {
    throw new Error('Generated module must export async "invokeTool" function.');
  }
  const inputSchemaByTool = imported.inputSchemaByTool;
  return {
    generatedTools,
    invokeTool,
    inputSchemaByTool: inputSchemaByTool && typeof inputSchemaByTool === "object" && !Array.isArray(inputSchemaByTool) ? inputSchemaByTool : void 0
  };
}
async function importGeneratedModule(modulePath) {
  const absolutePath = asLocalModulePath(modulePath);
  const imported = await import(pathToFileURL(absolutePath).href);
  if (!imported || typeof imported !== "object") {
    throw new Error(`Generated module "${modulePath}" did not export an object.`);
  }
  return readRuntimeModule(imported);
}
async function importGeneratedModuleWithoutCache(modulePath) {
  const absolutePath = asLocalModulePath(modulePath);
  const moduleUrl = pathToFileURL(absolutePath);
  moduleUrl.searchParams.set("t", `${Date.now()}`);
  const imported = await import(moduleUrl.href);
  if (!imported || typeof imported !== "object") {
    throw new Error(`Generated module "${modulePath}" did not export an object.`);
  }
  return readRuntimeModule(imported);
}
async function runMcpServerFromGeneratedModule(modulePath, options = {}) {
  const generated = await importGeneratedModule(modulePath);
  const loadModule = options.reloadModulePerRequest ? () => importGeneratedModuleWithoutCache(modulePath) : () => importGeneratedModule(modulePath);
  const server = new McpServer({
    name: "db2ai-generated-tools",
    version: "0.1.0"
  });
  for (const tool of generated.generatedTools) {
    const rawSchema = generated.inputSchemaByTool?.[tool.toolName];
    const inputSchema = rawSchema !== void 0 ? jsonSchemaToZod(rawSchema) : fallbackInputSchema;
    server.registerTool(
      tool.toolName,
      {
        title: typeof tool.title === "string" && tool.title.length > 0 ? tool.title : void 0,
        description: tool.description,
        inputSchema
      },
      async (args) => {
        const a = args;
        const currentModule = await loadModule();
        const result = await currentModule.invokeTool(tool.toolName, {
          limit: a.limit,
          offset: a.offset
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }
    );
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// packages/cli/mcp-bundle/mcp-standalone-entry.ts
var modPath = process.argv[2];
if (!modPath) {
  console.error("Usage: node mcp-serve.mjs <path-to-*-tools.mjs>");
  process.exit(1);
}
loadLocalEnvFiles([process.cwd(), path3.dirname(path3.resolve(modPath))]);
await runMcpServerFromGeneratedModule(modPath);
