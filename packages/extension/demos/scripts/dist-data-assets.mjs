import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Relative dirs under demosRoot to copy into `build:mcp` outDir (DuckDB file sources).
 * Keys are module names (same as `npm run build:mcp -- … <module>`).
 */
const MODULE_DATA_DIRS = {
    flight: ['flights'],
    'sales-report': ['sales-report']
};

/**
 * @param {string} moduleName
 * @param {string} outDir
 * @param {string} demosRoot
 */
export function copyDb2aiDistDataAssets(moduleName, outDir, demosRoot) {
    const dirs = MODULE_DATA_DIRS[moduleName];
    if (!dirs) {
        return;
    }
    for (const rel of dirs) {
        const src = path.join(demosRoot, rel);
        if (!existsSync(src)) {
            throw new Error(`[dist-data-assets] missing ${src} for module ${moduleName}`);
        }
        cpSync(src, path.join(outDir, rel), { recursive: true });
    }
}
