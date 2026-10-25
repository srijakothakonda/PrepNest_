const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prepnest',
    port: process.env.DB_PORT || 3306,

    // TiDB Cloud requires a secure connection (only used when not on localhost)
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
        ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        : undefined,

    waitForConnections: true,
    connectionLimit: 5,

    // Return DATE columns as strings instead of JS Date objects
    dateStrings: true
});

module.exports = pool;