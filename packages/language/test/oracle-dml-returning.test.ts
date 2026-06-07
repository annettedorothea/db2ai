import { describe, expect, test } from 'vitest';
import { isOracleNumericReturningColumn, prepareOracleDmlReturning } from '../src/oracle-dml-returning.js';

describe('oracle-dml-returning', () => {
    test('prepareOracleDmlReturning appends INTO bind placeholders for UPDATE', () => {
        const sql =
            'UPDATE plants SET common_name = :commonName WHERE plant_id = :plantId RETURNING plant_id, common_name';
        const prepared = prepareOracleDmlReturning(sql);
        expect(prepared?.sqlText).toContain('INTO :ret0, :ret1');
    });

    test('prepareOracleDmlReturning appends INTO bind placeholders for DELETE', () => {
        const sql = 'DELETE FROM plants WHERE plant_id = :plantId RETURNING plant_id, common_name, latin_name';
        const prepared = prepareOracleDmlReturning(sql);
        expect(prepared?.outBindNames).toEqual(['ret0', 'ret1', 'ret2']);
    });

    test('prepareOracleDmlReturning appends INTO bind placeholders', () => {
        const sql = `
            INSERT INTO plants (common_name, latin_name, description)
            VALUES (:commonName, :latinName, :aboutText)
            RETURNING plant_id, common_name, latin_name, description
        `;
        const prepared = prepareOracleDmlReturning(sql);
        expect(prepared).toBeDefined();
        expect(prepared?.returningColumns).toEqual(['plant_id', 'common_name', 'latin_name', 'description']);
        expect(prepared?.outBindNames).toEqual(['ret0', 'ret1', 'ret2', 'ret3']);
        expect(prepared?.sqlText).toContain('RETURNING plant_id, common_name, latin_name, description INTO');
        expect(prepared?.sqlText).toContain(':ret0, :ret1, :ret2, :ret3');
    });

    test('prepareOracleDmlReturning leaves SQL with existing INTO unchanged', () => {
        const sql = 'INSERT INTO plants (common_name) VALUES (:commonName) RETURNING plant_id INTO :outPlantId';
        expect(prepareOracleDmlReturning(sql)).toBeUndefined();
    });

    test('isOracleNumericReturningColumn detects id columns', () => {
        expect(isOracleNumericReturningColumn('plant_id')).toBe(true);
        expect(isOracleNumericReturningColumn('common_name')).toBe(false);
    });
});
