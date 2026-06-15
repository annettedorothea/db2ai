import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error generated ESM utility (no .d.ts)
import { loadProjectEnvLocal } from '../../scripts/generated/load-env-local.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Demo DB credentials from .env.example when .env is absent — not full example (avoids OIDC URL side effects). */
const EXAMPLE_FALLBACK_KEYS = new Set([
    'ANIMALS_SQLSERVER_SA_PASSWORD',
    'ANIMALS_SQLSERVER_HOST_PORT',
    'ANIMALS_SQLSERVER_DATABASE_URL',
    'PLANTS_ORACLE_SYS_PASSWORD',
    'PLANTS_ORACLE_HOST_PORT',
    'PLANTS_ORACLE_DATABASE_URL'
]);

function stripOptionalQuotes(value: string): string {
    if (value.length < 2) {
        return value;
    }
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        return value.slice(1, -1);
    }
    return value;
}

function loadExampleKeysForDockerDemos(root: string): void {
    if (existsSync(path.join(root, '.env'))) {
        return;
    }
    const examplePath = path.join(root, '.env.example');
    if (!existsSync(examplePath)) {
        return;
    }
    for (const line of readFileSync(examplePath, 'utf-8').split(/\r?\n/u)) {
        const trimmed = line.trim();
        if (trimmed.length === 0 || trimmed.startsWith('#')) {
            continue;
        }
        const assignment = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed;
        const separator = assignment.indexOf('=');
        if (separator <= 0) {
            continue;
        }
        const key = assignment.slice(0, separator).trim();
        if (!EXAMPLE_FALLBACK_KEYS.has(key) || process.env[key] !== undefined) {
            continue;
        }
        process.env[key] = stripOptionalQuotes(assignment.slice(separator + 1).trim());
    }
}

loadProjectEnvLocal(projectRoot);
loadExampleKeysForDockerDemos(projectRoot);

// Direct-invoke tests use demo HS256 JWTs; OAuth integration tests pass IdP URL to spawned hosts explicitly.
delete process.env.ORDERS_POSTGRES_OAUTH_IDP_URL;
delete process.env.OAUTH_ISSUER;
delete process.env.OAUTH_AUDIENCE;
