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
    ssl: { rejectUnauthorized: false }
});

// Add process hook to shutdown pool
process.on('SIGINT', function () {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});

// Route to get tea items from database
router.get('/', async (req, res) => {
    try {
        const teaQuery = pool.query(`SELECT name, price FROM valid_tea_types ORDER BY id ASC`);
        const flavorQuery = pool.query(`SELECT name FROM valid_flavors ORDER BY id ASC`);
        const addonsQuery = pool.query(`SELECT name, price FROM valid_addons ORDER BY id ASC`);

        const [teas, flavors, addons] = await Promise.all([teaQuery, flavorQuery, addonsQuery]);

        res.render('customer_order_page', {
            teas: teas.rows,
            flavors: flavors.rows,
            addons: addons.rows
        });
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

// Route to submit an order
router.post('/submit-order', async (req, res) => {
    try {
        const orders = req.body.orders; // array of order objects
        const tip = parseFloat(req.body.tip) || 0;

        const now = new Date();
        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

        const result = await pool.query('SELECT MAX(id) AS max_id FROM orders');
        let maxId = result.rows[0].max_id || 0;

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            maxId += 1;

            const { cost, menu_item_price, addon_price, flavor, tea_type, quantity } = order;

            await pool.query(
                `INSERT INTO orders 
                (id, cost, tip, date, time, menu_item_price, addon_price, flavor, tea_type, quantity, order_number)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                [
                    maxId, cost, tip, date, time,
                    menu_item_price, addon_price, flavor, tea_type, quantity, maxId
                ]
            );
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Order insert error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
