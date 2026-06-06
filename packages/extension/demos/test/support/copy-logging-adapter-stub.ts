import { existsSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { demosRoot } from './paths.js';

/** Copy logging-adapter stub into a tmp fixture so generated imports resolve (see api2ai bookings-api-fixture). */
export async function copyLoggingAdapterStub(targetRoot: string): Promise<void> {
    const targetDir = path.join(targetRoot, 'src', 'utils');
    await fs.mkdir(targetDir, { recursive: true });
    for (const ext of ['ts', 'js'] as const) {
        const source = path.join(demosRoot, 'src', 'utils', `logging-adapter.${ext}`);
        if (!existsSync(source)) {
            continue;
        }
        await fs.copyFile(source, path.join(targetDir, `logging-adapter.${ext}`));
    }
}
