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
            flavors: all_flavors.rows
        };

        res.render('cashier_order_page', data);
    }catch(e){
        console.error("Database query error:", e);
        res.status(500).send("Internal Server Error");
    }
});


router.get('/orders', (req, res) => {
    let order_data = []
    const limit = 20;
    const offset = parseInt(req.query.offset) || 0;
    pool
        .query('SELECT id, time, date, cost FROM orders ORDER BY date DESC, time DESC LIMIT $1 OFFSET $2', [limit, offset])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                order_data.push(query_res.rows[i]);
            }
            const data = {
                order_data: order_data,
                hasMore: query_res.rowCount === limit,
                nextOffset: offset + limit
            };
            console.log(order_data);
            res.render('orders', data);
        });
});

router.get('/transactions', async (req, res) => {
    let trans = []
    const limit = 5000;
    const offset = parseInt(req.query.offset) || 0;
    const totalResult = await pool.query('SELECT COUNT(*) FROM orders');
    const totalOrders = parseInt(totalResult.rows[0].count);
    
    pool
        .query('SELECT * FROM orders ORDER BY date DESC, time DESC LIMIT $1 OFFSET $2', [limit, offset])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                trans.push(query_res.rows[i]);
            }
            const data = {
                trans: trans,
                hasMore: query_res.rowCount === limit,
                nextOffset: offset + limit,
                totalOrders: totalOrders,
                currentOffset: offset
            };
            //const data = {trans: trans};
            console.log(trans);
            res.render('transactions', data);
        });
});

router.get('/checkout', async(req, res)=>{
    const data = {name: 'checkout'};
    res.render('checkout', data);
});

module.exports = router;