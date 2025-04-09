var express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

var router = express.Router();
const myfunctions = ('./cashier-logic.js');

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
let menu_items = [];

process.on('SIGINT', function() {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});

router.get('/', async (req, res) => {
    try{
        const[all_menu_items, all_addons, all_flavors] = await Promise.all([
            pool.query('SELECT name, price FROM valid_tea_types'),
            pool.query('SELECT name, price FROM valid_addons'),
            pool.query('SELECT name FROM valid_flavors')
        ])

        const data = {
            menu_items: all_menu_items.rows,
            addons: all_addons.rows,
            flavors: all_flavors.rows,
            cashierFunction:myfunctions

        };

        res.render('cashier_order_page', data);
    }catch(e){
        console.error("Database query error:", e);
        res.status(500).send("Internal Server Error");
    }
});


router.get('/transactions', (req, res) => {
    const data = {name: 'Transaction page'};
    res.render('transactions', data);
});

router.get('/orders', async (req, res) => {
    const data = {name: 'Orders page'};
    res.render('orders', data);
});

module.exports = router;