export type OracleConnectConfig = {
    user: string;
    password: string;
    connectString: string;
};

/** Parse `oracle://user:pass@host:port/service` for `oracledb.getConnection` / `createPool`. */
export function parseOracleConnectInput(connectionString: string): OracleConnectConfig {
    const trimmed = connectionString.trim();
    const asHttp = trimmed.replace(/^oracle:\/\//i, 'http://');
    const url = new URL(asHttp);
    const serviceName = url.pathname.replace(/^\//, '');
    if (serviceName.length === 0) {
        throw new Error(
            'Oracle connection URL must include a service name path (e.g. oracle://user:pass@host:1521/FREEPDB1).'
        );
    }
    const port = url.port.length > 0 ? url.port : '1521';
    return {
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        connectString: `${url.hostname}:${port}/${serviceName}`
    };
}
