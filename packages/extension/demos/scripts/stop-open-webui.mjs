#!/usr/bin/env node
/**
 * Stop native Open WebUI (PID from ~/.open-webui.pid — only the process we started).
 * Usage: npm run open-webui:down
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnvLocal } from './generated/load-env-local.mjs';
import { stopOpenWebUi } from './open-webui-launch.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

loadProjectEnvLocal();
stopOpenWebUi(demosRoot);
