import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        exclude: ['out/**', 'tmp/**', 'node_modules/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts', 'test/smoke/**/*.ts', 'test/support/**/*.ts'],
            exclude: ['out/**', 'tmp/**']
        }
    }
});
