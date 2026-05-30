import { writeMinimalPackageJsonIfAbsent, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Ensures a minimal demo `package.json` exists when the project root has none yet. */
export function renderBootstrap(projectRoot: string, config: ProjectBootstrapConfig): void {
    writeMinimalPackageJsonIfAbsent(projectRoot, config);
}
