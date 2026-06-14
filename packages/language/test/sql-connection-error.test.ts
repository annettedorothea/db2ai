import { describe, expect, test } from 'vitest';
import { formatDatabaseUnreachableReason, isDatabaseUnreachableError } from '../src/sql-connection-error.js';

describe('sql-connection-error', () => {
    test('isDatabaseUnreachableError detects ECONNREFUSED', () => {
        const err = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
        expect(isDatabaseUnreachableError(err, 'postgres')).toBe(true);
    });

    test('isDatabaseUnreachableError detects Oracle listener errors', () => {
        expect(isDatabaseUnreachableError(new Error('ORA-12541: TNS:no listener'), 'oracle')).toBe(true);
        expect(isDatabaseUnreachableError(new Error('NJS-503: connection to host failed'), 'oracle')).toBe(true);
        expect(
            isDatabaseUnreachableError(
                new Error(
                    'NJS-518: cannot connect to Oracle Database. Service "FREEPDB1" is not registered with the listener at host 127.0.0.1 port 55221.'
                ),
                'oracle'
            )
        ).toBe(true);
    });

    test('isDatabaseUnreachableError rejects SQL syntax and schema errors', () => {
        expect(isDatabaseUnreachableError(new Error('ORA-00942: table or view does not exist'), 'oracle')).toBe(false);
        expect(isDatabaseUnreachableError(new Error('Incorrect syntax near OUTPUT.'), 'sqlserver')).toBe(false);
    });

    test('formatDatabaseUnreachableReason shortens message', () => {
        const err = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
        expect(formatDatabaseUnreachableReason(err)).toContain('ECONNREFUSED');
    });
});
