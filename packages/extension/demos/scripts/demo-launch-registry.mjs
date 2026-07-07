/**
 * Per-demo launch config — keys match .cursor/mcp.json server names (and mcp:inspect).
 *
 * @typedef {object} DockerServiceSpec
 * @property {string} service compose service name
 * @property {string[]} [profiles] e.g. ['mssql'] | ['oracle']
 * @property {string[]} [postScripts] scripts/database/*.mjs after container is up
 *
 * @typedef {object} DemoLaunchSpec
 * @property {DockerServiceSpec[]} docker
 * @property {'http' | 'oauth'} mcpMode
 * @property {string} [httpDemo] key in mcp-http-demos.mjs
 * @property {string} [oauthDemo] key in mcp-oauth-demos.mjs
 * @property {boolean} [oauthIdp] start oauth-idp before oauth MCP host
 */

/** @type {Record<string, DemoLaunchSpec>} */
export const DEMO_LAUNCH_REGISTRY = {
    'sakila-mysql': {
        docker: [{ service: 'sakila' }],
        mcpMode: 'http',
        httpDemo: 'sakila-mysql'
    },
    'sakila-mariadb': {
        docker: [{ service: 'sakila' }],
        mcpMode: 'http',
        httpDemo: 'sakila-mariadb'
    },
    'pagila-postgresql': {
        docker: [{ service: 'pagila' }],
        mcpMode: 'http',
        httpDemo: 'pagila-postgresql'
    },
    'orders-postgresql': {
        docker: [{ service: 'orders-postgresql' }],
        mcpMode: 'oauth',
        oauthDemo: 'orders-postgresql',
        oauthIdp: true
    },
    'animals-sqlserver': {
        docker: [
            {
                service: 'animals-sqlserver',
                profiles: ['mssql'],
                postScripts: ['apply-animals-sqlserver-schema.mjs']
            }
        ],
        mcpMode: 'http',
        httpDemo: 'animals-sqlserver'
    },
    'plants-oracle': {
        docker: [
            {
                service: 'plants-oracle',
                profiles: ['oracle'],
                postScripts: ['wait-plants-oracle.mjs', 'apply-plants-oracle-schema.mjs']
            }
        ],
        mcpMode: 'http',
        httpDemo: 'plants-oracle'
    }
};

export const DEMO_LAUNCH_NAMES = Object.keys(DEMO_LAUNCH_REGISTRY);
