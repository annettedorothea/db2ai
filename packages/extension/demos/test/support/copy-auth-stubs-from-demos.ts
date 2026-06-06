import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { demosRoot } from './paths.js';

async function copyAuthTree(sourceDir: string, targetDir: string): Promise<void> {
    await fs.mkdir(targetDir, { recursive: true });
    for (const entry of await fs.readdir(sourceDir, { withFileTypes: true })) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);
        if (entry.isDirectory()) {
            await copyAuthTree(sourcePath, targetPath);
            continue;
        }
        if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
            await fs.copyFile(sourcePath, targetPath);
        }
    }
}

/** Copy implemented auth stubs into a tmp fixture before generate (write-once stubs are preserved). */
export async function copyAuthStubsFromDemos(targetRoot: string): Promise<void> {
    const sourceAuthDir = path.join(demosRoot, 'src', 'auth');
    if (!existsSync(sourceAuthDir)) {
        return;
    }
    await copyAuthTree(sourceAuthDir, path.join(targetRoot, 'src', 'auth'));
}
