export type SqlserverConnectConfig = {
    server: string;
    port?: number;
    database?: string;
    user: string;
    password: string;
    options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
    };
};

/** Parse `sqlserver://` / `mssql://` URLs or pass through ADO-style `Server=…` strings for `mssql.connect`. */
export function parseSqlserverConnectInput(connectionString: string): string | SqlserverConnectConfig {
    const trimmed = connectionString.trim();
    if (/^Server=/i.test(trimmed)) {
        return trimmed;
    }

    const asHttp = trimmed.replace(/^mssql:\/\//i, 'http://').replace(/^sqlserver:\/\//i, 'http://');
    const url = new URL(asHttp);
    const database = url.pathname.replace(/^\//, '');
    const encryptParam = url.searchParams.get('encrypt');
    const trustParam = url.searchParams.get('trustServerCertificate');

    return {
        server: url.hostname,
        port: url.port.length > 0 ? Number.parseInt(url.port, 10) : 1433,
        database: database.length > 0 ? database : undefined,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        options: {
            encrypt: encryptParam === 'false' ? false : true,
            trustServerCertificate: trustParam === 'true' || trustParam === '1'
        }
    };
}
