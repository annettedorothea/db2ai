/**
 * Database setup for DuckDB (write-once — customize; re-generate does not overwrite).
 * Registers the flights CSV as a view for tool SQL.
 */
import type { DuckDBConnection } from '@duckdb/node-api';
import { resolveDemoDataPath } from '../../resolve-demo-data-path.js';

const flightsCsvPath = resolveDemoDataPath(import.meta.url, 'flights', 'flights.csv');

export async function initDatabase(db: DuckDBConnection): Promise<void> {
    const escaped = flightsCsvPath.replace(/'/g, "''");
    await db.run(`CREATE OR REPLACE VIEW flights AS SELECT * FROM read_csv_auto('${escaped}')`);
}
