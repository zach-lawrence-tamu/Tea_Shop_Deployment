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

router.post('/delete_menu_item', (req, res) => {
    console.log("post:", req.body);
    console.log("id", req.body.id);
    pool.query("DELETE FROM valid_tea_types WHERE id=" + req.body.id);
});

router.post('/delete_addon', (req, res) => {
    console.log("post:", req.body);
    console.log("id", req.body.id);
    pool.query("DELETE FROM valid_addons WHERE id=" + req.body.id);
});

router.post('/delete_flavor', (req, res) => {
    console.log("post:", req.body);
    console.log("id", req.body.id);
    pool.query("DELETE FROM valid_flavors WHERE id=" + req.body.id);
});

router.post('/modify-inventory', (req, res) => {
    if (req.body.data['amount-form'] === '') {
        req.body.data['amount-form'] = 0;
    }
    if (req.body.data['cost-per-form'] === '') {
        req.body.data['cost-per-form'] = 0;
    }

    pool.query("UPDATE inventory_items SET ingredient = '" + req.body.data['ingredient-form'] + "', amount = " + req.body.data['amount-form']
        + ", cost_per_amount = " + req.body.data['cost-per-form'] + " WHERE item_id = " + req.body.id);
});

router.post('/add-inventory', (req, res) => {
    if (req.body.data['amount-form'] === '') {
        req.body.data['amount-form'] = 0;
    }
    if (req.body.data['cost-per-form'] === '') {
        req.body.data['cost-per-form'] = 0;
    }
    
    pool.query("INSERT INTO inventory_items (item_id, ingredient, amount, cost_per_amount) VALUES (" + req.body.id + ", '" + req.body.data['ingredient-form'] + "', " + req.body.data['amount-form'] + ", " + req.body.data['cost-per-form'] + ")");
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

router.get('/max_inventory_id', async (req, res) => {
    pool.query("select item_id from inventory_items where item_id = (select max(item_id) from inventory_items)")
    .then(query_res => {
        res.status(200).send('' + query_res.rows[0].item_id);
    })

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