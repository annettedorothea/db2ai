import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as z from 'zod/v4';

type GeneratedTool = {
    toolName: string;
    title?: string;
    description: string;
};

type GeneratedInvokeOptions = {
    limit?: number;
    offset?: number;
};

type GeneratedRuntimeModule = {
    generatedTools: GeneratedTool[];
    invokeTool: (toolName: string, options?: GeneratedInvokeOptions) => Promise<unknown>;
    inputSchemaByTool?: Record<string, unknown>;
};

type RunMcpServerOptions = {
    reloadModulePerRequest?: boolean;
};

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function zodNumericPicklist(values: readonly number[]): z.ZodTypeAny {
    if (values.length === 0) {
        return z.never();
    }
    if (values.length === 1) {
        return z.literal(values[0]!);
    }
    const literals = values.map(v => z.literal(v));
    return z.union(literals as unknown as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]);
}

function jsonSchemaToZod(schema: unknown): z.ZodTypeAny {
    if (schema === null || typeof schema !== 'object') {
        return z.unknown();
    }
    const s = schema as Record<string, unknown>;

    if (Array.isArray(s.anyOf)) {
        const parts = s.anyOf.map(p => jsonSchemaToZod(p));
        if (parts.length === 0) {
            return z.never();
        }
        if (parts.length === 1) {
            return parts[0]!;
        }
        return z.union(parts as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]);
    }

    if (s.type === 'object' && s.properties !== undefined && typeof s.properties === 'object' && !Array.isArray(s.properties)) {
        const props = s.properties as Record<string, unknown>;
        const required = new Set(
            Array.isArray(s.required) ? (s.required as unknown[]).filter((x): x is string => typeof x === 'string') : []
        );
        const shape: Record<string, z.ZodTypeAny> = {};
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

    if (s.type === 'array') {
        return z.array(jsonSchemaToZod(s.items));
    }

    if (s.type === 'string') {
        return z.string();
    }

    if (s.type === 'number' || s.type === 'integer') {
        if (Array.isArray(s.enum) && s.enum.length >= 1 && s.enum.every(isFiniteNumber)) {
            return zodNumericPicklist(s.enum);
        }
        return z.number();
    }

    if (s.type === 'boolean') {
        return z.boolean();
    }

    return z.unknown();
}

const fallbackInputSchema = z
    .object({
        limit: z.number().int().min(1).optional(),
        offset: z.number().int().min(0).optional()
    })
    .strict();

function asLocalModulePath(modulePath: string): string {
    if (modulePath.startsWith('file://')) {
        throw new Error('mcp-serve.mjs accepts local file paths only (no file:// URLs).');
    }
    return path.resolve(modulePath);
}

function readRuntimeModule(imported: Record<string, unknown>): GeneratedRuntimeModule {
    const generatedTools = imported.generatedTools;
    const invokeTool = imported.invokeTool;
    if (!Array.isArray(generatedTools)) {
        throw new Error('Generated module must export "generatedTools" array.');
    }
    if (typeof invokeTool !== 'function') {
        throw new Error('Generated module must export async "invokeTool" function.');
    }
    const inputSchemaByTool = imported.inputSchemaByTool;
    return {
        generatedTools: generatedTools as GeneratedTool[],
        invokeTool: invokeTool as GeneratedRuntimeModule['invokeTool'],
        inputSchemaByTool:
            inputSchemaByTool && typeof inputSchemaByTool === 'object' && !Array.isArray(inputSchemaByTool)
                ? (inputSchemaByTool as Record<string, unknown>)
                : undefined
    };
}

async function importGeneratedModule(modulePath: string): Promise<GeneratedRuntimeModule> {
    const absolutePath = asLocalModulePath(modulePath);
    const imported = await import(pathToFileURL(absolutePath).href);
    if (!imported || typeof imported !== 'object') {
        throw new Error(`Generated module "${modulePath}" did not export an object.`);
    }
    return readRuntimeModule(imported as Record<string, unknown>);
}

async function importGeneratedModuleWithoutCache(modulePath: string): Promise<GeneratedRuntimeModule> {
    const absolutePath = asLocalModulePath(modulePath);
    const moduleUrl = pathToFileURL(absolutePath);
    moduleUrl.searchParams.set('t', `${Date.now()}`);
    const imported = await import(moduleUrl.href);
    if (!imported || typeof imported !== 'object') {
        throw new Error(`Generated module "${modulePath}" did not export an object.`);
    }
    return readRuntimeModule(imported as Record<string, unknown>);
}

export async function runMcpServerFromGeneratedModule(modulePath: string, options: RunMcpServerOptions = {}): Promise<void> {
    const generated = await importGeneratedModule(modulePath);
    const loadModule = options.reloadModulePerRequest
        ? () => importGeneratedModuleWithoutCache(modulePath)
        : () => importGeneratedModule(modulePath);
    const server = new McpServer({
        name: 'db2ai-generated-tools',
        version: '0.1.0'
    });

    for (const tool of generated.generatedTools) {
        const rawSchema = generated.inputSchemaByTool?.[tool.toolName];
        const inputSchema = rawSchema !== undefined ? jsonSchemaToZod(rawSchema) : fallbackInputSchema;

        server.registerTool(
            tool.toolName,
            {
                title: typeof tool.title === 'string' && tool.title.length > 0 ? tool.title : undefined,
                description: tool.description,
                inputSchema
            },
            async args => {
                const a = args as GeneratedInvokeOptions;
                const currentModule = await loadModule();
                const result = await currentModule.invokeTool(tool.toolName, {
                    limit: a.limit,
                    offset: a.offset
                });
                return {
                    content: [
                        {
                            type: 'text',
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
