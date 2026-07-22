import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolve a file under the demos workspace or next to a `build:mcp` bundle.
 *
 * - Workspace: `initDatabase` lives at `src/db/db2ai/<module>-tools/` → four levels up is demos root.
 * - Dist: esbuild inlines into `dist/mcp/<module>-<host>/server.mjs`; data dirs are copied beside it.
 */
export function resolveDemoDataPath(importMetaUrl: string, ...relativeSegments: string[]): string {
    const here = path.dirname(fileURLToPath(importMetaUrl));
    const roots = [
        path.resolve(here, '../../../..'), // src/db/db2ai/<module>-tools/
        here // dist/mcp/<module>-<host>/
    ];
    const tried: string[] = [];
    for (const root of roots) {
        const candidate = path.join(root, ...relativeSegments);
        tried.push(candidate);
        if (existsSync(candidate)) {
            return candidate;
        }
    }
    throw new Error(`Demo data file not found. Tried:\n${tried.map((p) => `  ${p}`).join('\n')}`);
}
