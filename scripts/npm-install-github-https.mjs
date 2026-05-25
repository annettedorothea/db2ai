#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const userArgs = process.argv.slice(2);
const npmArgs = ['install', ...userArgs];
const existingCount = Number.parseInt(process.env.GIT_CONFIG_COUNT ?? '0', 10);
const configCount = Number.isFinite(existingCount) && existingCount >= 0 ? existingCount : 0;

const env = {
    ...process.env,
    GIT_CONFIG_COUNT: String(configCount + 2),
    [`GIT_CONFIG_KEY_${configCount}`]: 'url.https://github.com/.insteadOf',
    [`GIT_CONFIG_VALUE_${configCount}`]: 'ssh://git@github.com/',
    [`GIT_CONFIG_KEY_${configCount + 1}`]: 'url.https://github.com/.insteadOf',
    [`GIT_CONFIG_VALUE_${configCount + 1}`]: 'git@github.com:'
};

console.log('[install:github-https] running npm install with GitHub SSH URLs rewritten to HTTPS for this process');

const result = spawnSync(npmCommand, npmArgs, {
    env,
    stdio: 'inherit'
});

process.exit(result.status ?? 1);
