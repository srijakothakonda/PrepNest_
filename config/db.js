const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prepnest',

    waitForConnections: true,
    connectionLimit: 10,

    // IMPORTANT: Return DATE columns as strings instead of JS Date objects
    dateStrings: true
});

module.exports = pool;