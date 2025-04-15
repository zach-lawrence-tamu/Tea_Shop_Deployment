var express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

var router = express.Router();

// Create pool
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: {rejectUnauthorized: false}
});

// Add process hook to shutdown pool
process.on('SIGINT', function() {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});

// Route to get tea items from database
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT name, price 
            FROM valid_tea_types 
            ORDER BY id ASC
            OFFSET 0 
            LIMIT (SELECT COUNT(*) - 1 FROM valid_tea_types)
        `);
        console.log('Query successful:', result.rows); // Debugging line
        res.render('customer_order_page', { teas: result.rows });
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

module.exports = router;
