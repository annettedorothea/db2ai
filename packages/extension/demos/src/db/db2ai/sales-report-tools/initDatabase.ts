/**
 * Database setup for DuckDB (write-once — customize; re-generate does not overwrite).
 * Loads a messy multi-sheet Excel sales report into clean views for tool SQL.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DuckDBConnection } from '@duckdb/node-api';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const reportXlsxPath = path.join(demosRoot, 'sales-report', 'Monatsbericht_Vertrieb_Q1_2026.xlsx');

function sqlStringLiteral(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

export async function initDatabase(db: DuckDBConnection): Promise<void> {
    const xlsx = sqlStringLiteral(reportXlsxPath);

    await db.run('INSTALL excel');
    await db.run('LOAD excel');

    // Umsatz_Roh: title rows, blank lines after header, footer "Summe" / "*** Ende ***"
    await db.run(`
        CREATE OR REPLACE VIEW sales_lines AS
        SELECT
            TRIM(CAST("Kd-Nr." AS VARCHAR)) AS customer_id,
            TRIM(CAST(Kunde AS VARCHAR)) AS customer_name,
            TRIM(CAST(Region AS VARCHAR)) AS region,
            TRIM(CAST(Warengruppe AS VARCHAR)) AS product_group,
            TRY_CAST(CAST("Netto EUR" AS VARCHAR) AS DOUBLE) AS net_eur,
            CASE
                WHEN TRY_CAST(CAST("Belegdatum" AS VARCHAR) AS DOUBLE) IS NOT NULL
                THEN DATE '1899-12-30' + CAST(TRY_CAST(CAST("Belegdatum" AS VARCHAR) AS INTEGER) AS INTEGER)
                ELSE TRY_CAST(CAST("Belegdatum" AS VARCHAR) AS DATE)
            END AS document_date
        FROM read_xlsx(
            ${xlsx},
            sheet := 'Umsatz_Roh',
            header := true,
            range := 'A4:F200',
            stop_at_empty := false,
            ignore_errors := true
        )
        WHERE regexp_matches(TRIM(CAST("Kd-Nr." AS VARCHAR)), '^[0-9]+$')
          AND TRY_CAST(CAST("Netto EUR" AS VARCHAR) AS DOUBLE) IS NOT NULL
    `);

    // Kunden: title + blank rows above the real header
    await db.run(`
        CREATE OR REPLACE VIEW customers AS
        SELECT
            TRIM(CAST(Kundennummer AS VARCHAR)) AS customer_id,
            TRIM(CAST(Name AS VARCHAR)) AS customer_name,
            TRIM(CAST(PLZ AS VARCHAR)) AS postal_code,
            TRIM(CAST(Ort AS VARCHAR)) AS city,
            TRIM(CAST(Segment AS VARCHAR)) AS segment
        FROM read_xlsx(
            ${xlsx},
            sheet := 'Kunden',
            header := true,
            range := 'A4:E40',
            stop_at_empty := true,
            ignore_errors := true
        )
        WHERE regexp_matches(TRIM(CAST(Kundennummer AS VARCHAR)), '^[0-9]+$')
    `);
}
