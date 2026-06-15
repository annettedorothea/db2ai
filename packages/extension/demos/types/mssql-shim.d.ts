declare module 'mssql' {
    type ConnectionPool = {
        request(): {
            input(name: string, type: unknown, value: unknown): unknown;
            query(sql: string): Promise<{ recordset: unknown[] }>;
        };
        close(): Promise<void>;
    };

    const sql: {
        connect(config: unknown): Promise<ConnectionPool>;
        Int: unknown;
        Decimal: (precision: number, scale: number) => unknown;
        Bit: unknown;
        NVarChar: (length: unknown) => unknown;
        MAX: unknown;
    };

    export default sql;
}
