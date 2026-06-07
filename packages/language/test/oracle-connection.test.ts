import { describe, expect, test } from 'vitest';
import { parseOracleConnectInput } from '../src/oracle-connection.js';

describe('oracle-connection', () => {
    test('parses oracle:// URLs into oracledb connect config', () => {
        expect(parseOracleConnectInput('oracle://plants:PlantsDemo123@localhost:55221/FREEPDB1')).toEqual({
            user: 'plants',
            password: 'PlantsDemo123',
            connectString: 'localhost:55221/FREEPDB1'
        });
    });

    test('requires a service name path', () => {
        expect(() => parseOracleConnectInput('oracle://plants:pass@localhost:55221')).toThrow(/service name/i);
    });
});
