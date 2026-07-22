/**
 * Database setup for DuckDB (write-once — customize; re-generate does not overwrite).
 * Registers the flights CSV as a view for tool SQL.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const flightsCsvPath = path.join(demosRoot, 'flights', 'flights.csv');
export async function initDatabase(db) {
    const escaped = flightsCsvPath.replace(/'/g, "''");
    await db.run(`CREATE OR REPLACE VIEW flights AS SELECT * FROM read_csv_auto('${escaped}')`);
}
