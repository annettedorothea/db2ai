declare module 'oracledb' {
    export const OUT_FORMAT_OBJECT: number;
    export const BIND_OUT: number;
    export const NUMBER: number;
    export const STRING: number;

    export type Connection = {
        execute<T extends Record<string, unknown>>(
            sql: string,
            binds?: Record<string, unknown>,
            options?: { outFormat?: number; autoCommit?: boolean }
        ): Promise<{ rows?: T[]; outBinds?: Record<string, unknown[]> }>;
        close(): Promise<void>;
    };

    export type ConnectionAttributes = {
        user: string;
        password: string;
        connectString: string;
    };

    function getConnection(config: ConnectionAttributes): Promise<Connection>;

    export default {
        getConnection,
        OUT_FORMAT_OBJECT,
        BIND_OUT,
        NUMBER,
        STRING
    };
}
