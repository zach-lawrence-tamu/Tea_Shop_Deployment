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

//menu and inventory page

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

router.post('/modify_inventory', (req, res) => {
    if (req.body.data['amount-form'] === '') {
        req.body.data['amount-form'] = 0;
    }
    if (req.body.data['cost-per-form'] === '') {
        req.body.data['cost-per-form'] = 0;
    }

    pool.query("UPDATE inventory_items SET ingredient = '" + req.body.data['ingredient-form'] + "', amount = " + req.body.data['amount-form']
        + ", cost_per_amount = " + req.body.data['cost-per-form'] + " WHERE item_id = " + req.body.id);
});

router.post('/add_inventory', (req, res) => {
    if (req.body.data['amount-form'] === '') {
        req.body.data['amount-form'] = 0;
    }
    if (req.body.data['cost-per-form'] === '') {
        req.body.data['cost-per-form'] = 0;
    }

    pool.query("INSERT INTO inventory_items (item_id, ingredient, amount, cost_per_amount) VALUES (" + req.body.id + ", '" + req.body.data['ingredient-form'] + "', " + req.body.data['amount-form'] + ", " + req.body.data['cost-per-form'] + ")");
});

router.post('/modify_menu_item', (req, res) => {
    if (req.body.data['tea-price-form'] === '') {
        req.body.data['tea-price-form'] = 0.01;
    }
    
    pool.query("UPDATE valid_tea_types SET name = '" + req.body.data['tea-form'] + "', price = " + req.body.data['tea-price-form'] + " WHERE id = " + req.body.id);
});

router.post('/add_menu_item', (req, res) => {
    if (req.body.data['tea-price-form'] === '') {
        req.body.data['tea-price-form'] = 0.01;
    }

    pool.query("INSERT INTO valid_tea_types (id, name, price) VALUES (" + req.body.id + ", '" + req.body.data['tea-form'] + "', " + req.body.data['tea-price-form'] + ")");
});

router.post('/modify_addon', (req, res) => {
    if (req.body.data['addon-price-form'] === '') {
        req.body.data['addon-price-form'] = 0.01;
    }
    
    pool.query("UPDATE valid_addons SET name = '" + req.body.data['addon-name-form'] + "', price = " + req.body.data['addon-price-form'] + " WHERE id = " + req.body.id);
});

router.post('/add_addon', (req, res) => {
    if (req.body.data['addon-price-form'] === '') {
        req.body.data['addon-price-form'] = 0.01;
    }

    pool.query("INSERT INTO valid_addons (id, name, price) VALUES (" + req.body.id + ", '" + req.body.data['addon-name-form'] + "', " + req.body.data['addon-price-form'] + ")");
});

router.post('/add_flavor', (req, res) => {
    pool.query("INSERT INTO valid_flavors (id, name) VALUES (" + req.body.id + ", '" + req.body.data['flavor-name-form'] + "')");
});

//reports

router.get('/reports', async (req, res) => {
    try {
        const[all_menu_items, all_flavors] = await Promise.all([
            pool.query('SELECT * FROM valid_tea_types'),
            pool.query('SELECT * FROM valid_flavors')
        ])

        const data = {
            menu_items: all_menu_items.rows,
            flavors: all_flavors.rows,
        };

        console.log(data);
        res.render("reports", data);
    }
    catch(e) {
        console.error("Database query error:", e);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/x_report", (req, res) => {
    console.log("activated x report get request");
});

router.get("/z_report", async (req, res) => {
    try {
        const[all_menu_items, all_flavors] = await Promise.all([
            pool.query('SELECT * FROM valid_tea_types'),
            pool.query('SELECT * FROM valid_flavors')
        ])

        console.log("FIELDS: ", all_menu_items.fields.length);
        console.log("DATA: ", all_menu_items.rows.toString());
        
        var test = "SUM(CASE WHEN tea_type = '" + all_menu_items.rows[0].name + "' THEN quantity ELSE 0 END) AS \"" + all_menu_items.rows[0].name + "\"";
        console.log("QUERY: ", test);


        var count_queries = "SELECT SUM(cost) AS total_cost, SUM(tip) AS total_tip, " +
                        "SUM(quantity) AS item_sold,  " +
                        "SUM(addon_price) AS total_addon_cost,  " +
                        "date,  " +
                        "SUM(CASE WHEN tea_type = 'Milk Tea' THEN quantity ELSE 0 END) AS milk,  " +
                        "SUM(CASE WHEN tea_type = 'Ice Blended Tea' THEN quantity ELSE 0 END) AS iced,  " +
                        "SUM(CASE WHEN tea_type = 'Brewed Tea' THEN quantity ELSE 0 END) AS \"brewed tea\",  " +
                        "SUM(CASE WHEN tea_type = 'Fruit Tea' THEN quantity ELSE 0 END) AS Fruit_Tea,  " +
                        "SUM(CASE WHEN tea_type = 'Fresh Milk' THEN quantity ELSE 0 END) AS Fresh_Milk,  " +
                        "SUM(CASE WHEN tea_type = 'Tea Mojito' THEN quantity ELSE 0 END) AS Tea_Mojito,  " +
                        "SUM(CASE WHEN flavor = 'chocolate' THEN quantity ELSE 0 END) AS chocolate,  " +
                        "SUM(CASE WHEN flavor = 'vanilla' THEN quantity ELSE 0 END) AS vanilla,  " +
                        "SUM(CASE WHEN flavor = 'strawberry' THEN quantity ELSE 0 END) AS strawberry,  " +
                        "SUM(CASE WHEN flavor = 'blueberry' THEN quantity ELSE 0 END) AS blueberry,  " +
                        "SUM(CASE WHEN flavor = 'banana' THEN quantity ELSE 0 END) AS banana  " +
                        "FROM orders " +
                        "WHERE date = '2024-05-28'" +
                        "GROUP BY date;"

        const[sums] = await Promise.all([
            pool.query(count_queries)
        ])

        const data = {
            menu_items: all_menu_items.rows,
            flavors: all_flavors.rows,
            counts: sums.rows
        };

        console.log(data);
        res.status(200).send(data);
    }
    catch(e) {
        console.error("Database query error:", e);
        res.status(500).send("Internal Server Error");
    }
});

/*
need these for adding/removing addons
ALTER TABLE addon ADD COLUMN beets bool DEFAULT f;
ALTER TABLE addon DROP COLUMN beets; 
*/

router.get("/graph", (req, res) => {
    console.log("graph get request");
})

//employees

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

router.post('/delete_employee', (req, res) => {
    console.log("post:", req.body);
    console.log("id", req.body.id);
    pool.query("DELETE FROM employees WHERE employee_id=" + req.body.id);
});

router.post('/modify_employee', (req, res) => {
    if (req.body.data['employee-hours-form'] === '') {
        req.body.data['employee-hours-form'] = 0;
    }

    pool.query("UPDATE employees SET weekly_hours_worked = " + req.body.data['employee-hours-form'] + ", manager_access = " + req.body.data['employee-access-form'] + ", password = '" + req.body.data['employee-password-form'] + "' WHERE employee_id = " + req.body.id);
});

router.post('/add_employee', (req, res) => {
    if (req.body.data['employee-hours-form'] === '') {
        req.body.data['employee-hours-form'] = 0;
    }

    pool.query("INSERT INTO employees (employee_id, weekly_hours_worked, manager_access, password) VALUES (" + req.body.id + ", " + req.body.data['employee-hours-form'] + ", " + req.body.data['employee-access-form'] + ", '" + req.body.data['employee-password-form'] + "')");
});

//max ids

router.get('/max_inventory_id', async (req, res) => {
    pool.query("select item_id from inventory_items where item_id = (select max(item_id) from inventory_items)")
    .then(query_res => {
        res.status(200).send('' + query_res.rows[0].item_id);
    })
});

router.get('/max_menu_id', async (req, res) => {
    pool.query("select id from valid_tea_types where id = (select max(id) from valid_tea_types)")
    .then(query_res => {
        res.status(200).send('' + query_res.rows[0].id);
    })
});

router.get('/max_addon_id', async (req, res) => {
    pool.query("select id from valid_addons where id = (select max(id) from valid_addons)")
    .then(query_res => {
        res.status(200).send('' + query_res.rows[0].id);
    })
});

router.get('/max_flavor_id', async (req, res) => {
    pool.query("select id from valid_flavors where id = (select max(id) from valid_flavors)")
    .then(query_res => {
        res.status(200).send('' + query_res.rows[0].id);
    })
});

router.get('/max_employee_id', async (req, res) => {
    pool.query("select employee_id from employees where employee_id = (select max(employee_id) from employees)")
    .then(query_res => {
        res.status(200).send('' + query_res.rows[0].employee_id);
    })
});



module.exports = router;