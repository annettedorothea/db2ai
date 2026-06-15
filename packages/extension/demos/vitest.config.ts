import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        exclude: ['tmp/**', 'node_modules/**'],
        setupFiles: ['./test/setup/load-project-env.ts'],
        // Docker demo fixtures share fixed container names; avoid parallel compose races in CI.
        fileParallelism: false
    }
});
