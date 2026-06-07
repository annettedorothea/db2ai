#!/usr/bin/env node
/**
 * Migrate each SQL { … } block independently: $n params → named params.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

function migrateParamBlocks(block) {
    const paramMap = new Map();
    let out = block;
    const paramRegex = /\$(\d+):\s*\{([^}]*)\}/g;
    for (const match of [...block.matchAll(paramRegex)]) {
        const token = `$${match[1]}`;
        const body = match[2];
        const nameMatch = body.match(/\bname:\s*([A-Za-z_][A-Za-z0-9_]*)/);
        if (!nameMatch) {
            throw new Error(`Missing name: in param block ${match[0]}`);
        }
        const name = nameMatch[1];
        paramMap.set(token, name);
        const newBody = body.replace(/\s*name:\s*[A-Za-z_][A-Za-z0-9_]*\s*/, ' ').trim();
        out = out.replace(match[0], `${name}: { ${newBody} }`);
    }
    const sorted = [...paramMap.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [token, name] of sorted) {
        out = out.replaceAll(token, `:${name}`);
    }
    return out;
}

function migrateSqlBlocks(content) {
    const lines = content.split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (/^SQL \{\s*$/.test(line.trim())) {
            const blockLines = [line];
            i++;
            let depth = 1;
            while (i < lines.length && depth > 0) {
                const inner = lines[i];
                blockLines.push(inner);
                for (const ch of inner) {
                    if (ch === '{') {
                        depth++;
                    } else if (ch === '}') {
                        depth--;
                    }
                }
                i++;
            }
            out.push(...migrateParamBlocks(blockLines.join('\n')).split('\n'));
            continue;
        }
        out.push(line);
        i++;
    }
    return out.join('\n');
}

function migrateContent(content) {
    let out = content;
    if (/^database env /m.test(out) && !/^database (postgres|postgresql|mysql|mariadb|sqlserver|mssql|oracle) /m.test(out)) {
        out = out.replace(/^database env /m, 'database postgres env ');
    }
    return migrateSqlBlocks(out);
}

function main() {
    const files = process.argv.slice(2);
    if (files.length === 0) {
        console.error('Usage: node scripts/migrate-named-params.mjs <file.db2ai> ...');
        process.exit(1);
    }
    for (const file of files) {
        const abs = path.resolve(file);
        const content = fs.readFileSync(abs, 'utf-8');
        fs.writeFileSync(abs, migrateContent(content));
        console.log(`migrated ${abs}`);
    }
}

main();
