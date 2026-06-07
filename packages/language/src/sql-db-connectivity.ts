import pg from 'pg';
import mysql from 'mysql2/promise';
import sql from 'mssql';
import oracledb from 'oracledb';
import type { ResolvedDatabaseDialect } from './dialect.js';
import { connectionUrlForMysqlDriver, isMysqlDialect } from './dialect.js';
import { parseOracleConnectInput } from './oracle-connection.js';
import { parseSqlserverConnectInput } from './sqlserver-connection.js';

async function probePostgresConnectivity(connectionUrl: string): Promise<void> {
    const client = new pg.Client({ connectionString: connectionUrl });
    await client.connect();
    try {
        await client.query('SELECT 1');
    } finally {
        await client.end();
    }
}

async function probeMysqlConnectivity(connectionUrl: string): Promise<void> {
    const connection = await mysql.createConnection(connectionUrlForMysqlDriver(connectionUrl));
    try {
        await connection.query('SELECT 1');
    } finally {
        await connection.end();
    }
}

async function probeSqlserverConnectivity(connectionUrl: string): Promise<void> {
    const pool = await sql.connect(parseSqlserverConnectInput(connectionUrl));
    try {
        await pool.request().batch('SELECT 1');
    } finally {
        await pool.close();
    }
}

async function probeOracleConnectivity(connectionUrl: string): Promise<void> {
    const connection = await oracledb.getConnection(parseOracleConnectInput(connectionUrl));
    try {
        await connection.execute('SELECT 1 FROM DUAL');
    } finally {
        await connection.close();
    }
}

/** Lightweight connectivity check before per-statement EXPLAIN probes. */
export async function probeDatabaseConnectivity(
    connectionUrl: string,
    dialect: ResolvedDatabaseDialect
): Promise<void> {
    if (isMysqlDialect(dialect)) {
        await probeMysqlConnectivity(connectionUrl);
        return;
    }
    if (dialect === 'sqlserver') {
        await probeSqlserverConnectivity(connectionUrl);
        return;
    }
    if (dialect === 'oracle') {
        await probeOracleConnectivity(connectionUrl);
        return;
    }
    await probePostgresConnectivity(connectionUrl);
}
