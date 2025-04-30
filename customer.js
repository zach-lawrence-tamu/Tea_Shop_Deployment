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
        console.log("Received order data:", req.body);

        const { orderData, addonData } = req.body;

        const orders = orderData?.orders;
        const tip = parseFloat(orderData?.tip) || 0;

        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            throw new Error("No orders found in the request body.");
        }

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0];

        const result = await pool.query('SELECT MAX(id) AS max_id FROM orders');
        let maxId = result.rows[0].max_id || 0;

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            maxId += 1;

            const {
                cost,
                menu_item_price,
                addon_price,
                flavor,
                tea_type,
                quantity,
                sugar_level,
                ice_level,
                addons = {},
                customer_requests = "" // default blank value
            } = order;

            // Insert into orders table
            await pool.query(
                `INSERT INTO orders 
                (id, cost, tip, date, time, menu_item_price, addon_price, flavor, tea_type, quantity, order_number)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                [
                    maxId, cost, tip, date, time,
                    menu_item_price, addon_price, flavor, tea_type, quantity, maxId
                ]
            );

            console.log("Addons for item:", addons);

            // Insert into addon table
            await pool.query(
                `INSERT INTO addon 
                (item_id, pearls, pudding, jelly, ice_cream, creama, boba, addon_price)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    maxId,
                    addons.Pearls || false,
                    addons.Pudding || false,
                    addons.Jelly || false,
                    addons["Ice Cream"] || false,
                    addons.Creama || false,
                    addons.Boba || false,
                    addon_price
                ]
            );

            // Update addon table with correct true/false values based on addonData
            const addonDetails = addonData.find(data => data.tea_type === tea_type);
            if (addonDetails) {
                const { addons: selectedAddons } = addonDetails;

                await pool.query(`
                    UPDATE addon
                    SET 
                        pearls = $1, 
                        pudding = $2, 
                        jelly = $3, 
                        ice_cream = $4, 
                        creama = $5, 
                        boba = $6
                    WHERE item_id = $7
                `, [
                    selectedAddons.Pearls || false,
                    selectedAddons.Pudding || false,
                    selectedAddons.Jelly || false,
                    selectedAddons["Ice Cream"] || false,
                    selectedAddons.Creama || false,
                    selectedAddons.Boba || false,
                    maxId // Make sure this is correctly referencing the item_id
                ]);
            }

            // Insert into menu_item table
            try{
            await pool.query(
                `INSERT INTO menu_item 
                (item_id, flavor, quantity, tea_type, sugar_level, ice_level, customer_requests, menu_item_price)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    maxId,
                    flavor,
                    quantity,
                    tea_type,
                    sugar_level,
                    ice_level,
                    customer_requests, // leaving it blank as per your request
                    menu_item_price
                ]
            );
            console.log("Successfully inserted into menu_item table.");
            } catch (error) {
                console.error('Error inserting into menu_item table:', error);
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Order insert error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
