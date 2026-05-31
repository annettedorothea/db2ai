import { mkdirSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const demosRoot = path.resolve(__dirname, '../..');
export const demosTmpRoot = path.join(demosRoot, 'tmp');

mkdirSync(demosTmpRoot, { recursive: true });
