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

// / refers to default page index.ejs
router.get('/', (req, res) => {
    const data = {name: 'Mario'};
    res.render('index', data);
});

router.get('/menu_inventory', (req, res) => {
    inventory = []
    pool
        .query('SELECT * FROM inventory_items;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventory.push(query_res.rows[i]);
            }
            const data = {inventory: inventory};
            console.log(inventory);
            res.render('menu_inventory', data);
        });
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

module.exports = router;