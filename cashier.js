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

router.get('/', (req, res) => {
    const data = {name: 'Cashier page'};
    res.render('cashier_order_page', data);
});

router.get('/orders', (req, res) => {
    const data = {name: 'Order page'};
    res.render('orders', data);
});

router.get('/transactions', (req, res) => {
    const data = {name: 'Transaction page'};
    res.render('transactions', data);
});

module.exports = router;