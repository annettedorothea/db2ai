declare module 'mssql' {
    type ConnectionPool = {
        request(): {
            input(name: string, value: unknown): unknown;
            batch(sql: string): Promise<unknown>;
        };
        close(): Promise<void>;
    };

    const sql: {
        connect(config: unknown): Promise<ConnectionPool>;
    };

    export default sql;
}
