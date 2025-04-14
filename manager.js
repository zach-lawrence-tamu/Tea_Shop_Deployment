var express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

var router = express.Router();
var hits = 0;

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

// Need to be able to modify addons, tea types, inventory items, and flavors
router.get('/menu_inventory', async (req, res) => {
    try {
        const[all_inventory_items, all_menu_items, all_addons, all_flavors] = await Promise.all([
            pool.query('SELECT * FROM inventory_items'),
            pool.query('SELECT * FROM valid_tea_types'),
            pool.query('SELECT * FROM valid_addons'),
            pool.query('SELECT * FROM valid_flavors')
        ])

        const data = {
            inventory: all_inventory_items.rows,
            menu_items: all_menu_items.rows,
            addons: all_addons.rows,
            flavors: all_flavors.rows
        };

        console.log(data);
        res.render('menu_inventory', data);
    }
    catch(e) {
        console.error("Database query error:", e);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/delete_inventory', (req, res) => {
    console.log("post:", req.body);
    console.log("id", req.body.id);
    pool.query("DELETE FROM inventory_items WHERE item_id=" + req.body.id);
});

router.get('/reports', (req, res) => {
    orders = []
    pool
    //TODO: modify queries needed for graphs and reports, for now it just displays some orders
        .query('SELECT * FROM orders where id <= 20;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                orders.push(query_res.rows[i]);
            }
            const data = {orders: orders};
            console.log(orders);
            res.render('reports', data);
        });
});

router.get('/employees', (req, res) => {
    employees = []
    pool
        .query('SELECT * FROM employees;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                employees.push(query_res.rows[i]);
            }
            const data = {orders: employees};
            console.log(employees);
            res.render('employees', data);
        });
});

router.get('/hitNum', function (req, res) {
    console.log('hits req');
    res.status(200).send('' + hits);
});

router.get('/add', function (req, res) {
    console.log('added hits');
    hits++;
    res.status(200).end();
});

module.exports = router;