/**
 * Bundles the extension host and language-server entry points into `out/` as `.cjs` files
 * (after `tsc`; `vscode` stays external for the VSIX runtime).
 *
 * Called by: `packages/extension/package.json` — `build` (optional `--watch` / `--minify` flags)
 */
//@ts-check
import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');
const minify = process.argv.includes('--minify');

const success = watch ? 'Watch build succeeded' : 'Build succeeded';

function getTime() {
    const date = new Date();
    return `[${`${padZeroes(date.getHours())}:${padZeroes(date.getMinutes())}:${padZeroes(date.getSeconds())}`}] `;
}

function padZeroes(i) {
    return i.toString().padStart(2, '0');
}

const plugins = [
    {
        name: 'external-duckdb-native',
        setup(build) {
            build.onResolve({ filter: /^@duckdb\// }, (args) => ({
                path: args.path,
                external: true
            }));
        }
    },
    {
        name: 'watch-plugin',
        setup(build) {
            build.onEnd((result) => {
                if (result.errors.length === 0) {
                    console.log(getTime() + success);
                }
            });
        }
    }
];

const ctx = await esbuild.context({
    entryPoints: ['src/extension/main.ts', 'src/language/main.ts'],
    outdir: 'out',
    bundle: true,
    target: 'ES2017',
    format: 'cjs',
    outExtension: {
        '.js': '.cjs'
    },
    loader: { '.ts': 'ts' },
    external: ['vscode'],
    platform: 'node',
    sourcemap: !minify,
    minify,
    plugins
});

if (watch) {
    await ctx.watch();
} else {
    await ctx.rebuild();
    ctx.dispose();
}
