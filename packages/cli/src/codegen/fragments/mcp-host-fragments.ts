import {
    renderMcpHostSharedTemplate,
    type McpHostSharedFragmentSet,
    type McpHostSharedMode
} from '@toolfactory.dev/core/codegen';
import { dbHelperFunctionsFragment, hostCoreTypesFragment } from './host-core-types.js';
import {
    resolveHostContextForCallFragment,
    resolveHostContextForHttpCallPassthroughFragment,
    resolveHostContextForHttpCallPublicFragment,
    validateHostAtStartupFragment,
    validateHttpMcpHostAtStartupFragment
} from './host-runtime.js';
import {
    oauthHostContextBaseUrlFieldsFragment,
    resolveHostContextForOAuthSessionFragment,
    validateOAuthHttpHostAtStartupFragment
} from './oauth-host-runtime.js';
import { readGeneratedModuleTailFragment } from './read-generated-module-tail.js';
import { describeUpstreamEnvFieldFragment, startupBannerConnectionEnvNotePrefixFragment } from './startup-banner.js';

/** db2ai product fragments for {@link renderMcpHostSharedTemplate}. */
const db2aiMcpHostFragments: McpHostSharedFragmentSet = {
    hostCoreTypes: hostCoreTypesFragment(),
    envLoadingToCredentialGap: `\n\n${dbHelperFunctionsFragment()}\n`,
    readGeneratedModuleTail: readGeneratedModuleTailFragment(),
    validateHostAtStartup: validateHostAtStartupFragment(),
    resolveHostContextForCall: resolveHostContextForCallFragment(),
    validateHttpMcpHostAtStartup: validateHttpMcpHostAtStartupFragment(),
    resolveHostContextForHttpCallPublic: resolveHostContextForHttpCallPublicFragment(),
    resolveHostContextForHttpCallPassthrough: resolveHostContextForHttpCallPassthroughFragment(),
    validateOAuthHttpHostAtStartup: validateOAuthHttpHostAtStartupFragment(),
    oauthHostContextBaseUrlFields: oauthHostContextBaseUrlFieldsFragment(),
    resolveHostContextForOAuthSession: resolveHostContextForOAuthSessionFragment(),
    describeUpstreamEnvField: describeUpstreamEnvFieldFragment(),
    startupBannerConnectionEnvNotePrefix: startupBannerConnectionEnvNotePrefixFragment()
};

export function renderMcpHostSharedSource(mode: McpHostSharedMode): string {
    return renderMcpHostSharedTemplate(mode, db2aiMcpHostFragments);
}
