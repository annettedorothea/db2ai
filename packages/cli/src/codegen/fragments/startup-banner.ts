export function describeUpstreamEnvFieldFragment(): string {
    return `
function describeUpstreamEnvField(
    generated: GeneratedHostModule,
    hostConfig: { baseUrlEnvKey?: string }
): { label: string; value: string } | undefined {
    if (generated.connectionEnv) {
        const key = generated.connectionEnv;
        const set = Boolean(process.env[key]?.trim());
        return { label: 'Database:', value: key + (set ? '' : ' (unset)') };
    }
    const key = hostConfig.baseUrlEnvKey?.trim();
    if (!key) {
        return undefined;
    }
    const set = Boolean(process.env[key]?.trim());
    return { label: 'Upstream:', value: key + (set ? '' : ' (unset)') };
}`.trim();
}

export function startupBannerConnectionEnvNotePrefixFragment(): string {
    return 'generated.connectionEnv, ';
}
