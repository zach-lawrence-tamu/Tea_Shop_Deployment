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

//

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
    pool.query("INSERT INTO valid_flavors (id, name) VALUES (" + req.body.id + ", '" + (req.body.data['flavor-name-form'].toLowerCase()) + "')");
});

//reports

router.get('/reports', async (req, res) => {
    try {
        res.render("reports");
    }
    catch(e) {
        console.error("Database query error:", e);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/x_report", (req, res) => {
    const currentDate = new Date();
    const currentTime = new Date();
    const hours = currentTime.getHours();
    var date = currentDate.getFullYear() + "-";
    
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    date += `${month}-${day}`;

    console.log(date, " ", hours);
    
    //for testing date = 2024-05-28
    date = "2025-05-01";

    console.log("activated x report get request");

    var query = "SELECT EXTRACT(HOUR FROM TO_TIMESTAMP(time, 'HH24:MI:SS')) AS sale_hour, " +
                "COUNT(*) AS sales, SUM(cost + tip) AS total_revenue " +
                "FROM orders " +
                "WHERE date = '" + date + "' " +
                "AND EXTRACT(HOUR FROM TO_TIMESTAMP(time, 'HH24:MI:SS')) BETWEEN 11 AND " + (hours - 1) +
                " GROUP BY sale_hour ORDER BY sale_hour;";

    pool.query(query)
    .then(query_res => {
        const data = {
            menu_items: query_res.rows,
        }
        res.status(200).send(data);
    });
});

router.get("/z_report", async (req, res) => {
    const currentDate = new Date();
    var date = currentDate.getFullYear() + "-";
    
    if (currentDate.getMonth() < 10)
        date += '0' + (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
    else
        date += (currentDate.getMonth() + 1) + "-" + currentDate.getDate();
    
    date = "2025-05-01";
    try {
        const[all_menu_items, all_flavors] = await Promise.all([
            pool.query('SELECT * FROM valid_tea_types'),
            pool.query('SELECT * FROM valid_flavors')
        ])

        var count_queries = "SELECT SUM(cost) AS total_cost, SUM(tip) AS total_tip, " +
                        "SUM(quantity) AS item_sold,  " +
                        "SUM(addon_price) AS total_addon_cost,  " +
                        "date";

        //console.log("FIELDS: ", all_menu_items.rowCount);
        //console.log("DATA: ", all_menu_items.rows.toString());
        
        for (let i = 0; i < all_menu_items.rowCount; i++)
        {
            count_queries += ", SUM(CASE WHEN tea_type = '" + all_menu_items.rows[i].name + "' THEN quantity ELSE 0 END) AS \"" + all_menu_items.rows[i].name + "\"";
        }

        for (let i = 0; i < all_flavors.rowCount; i++)
        {
            count_queries += ", SUM(CASE WHEN flavor = '" + all_flavors.rows[i].name.toLowerCase() + "' THEN quantity ELSE 0 END) AS \"" + all_flavors.rows[i].name.toLowerCase() + "\"";
        }

        //test date is 2024-05-28
        //date = "2024-05-28";
        count_queries += "FROM orders " +
                        "WHERE date = '" + date + "' " +
                        "GROUP BY date;";

        const[sums] = await Promise.all([
            pool.query(count_queries)
        ])

        const data = {
            menu_items: all_menu_items.rows,
            flavors: all_flavors.rows,
            counts: sums.rows,
        };

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

router.get("/graph", async (req, res) => {
    console.log("graph get request");
    
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: 'Missing start or end date' });
    }

    try {
        const query = `
            SELECT flavor, COUNT(*) AS count
            FROM orders
            WHERE date BETWEEN $1 AND $2
            GROUP BY flavor
            ORDER BY count DESC
        `;
        const result = await pool.query(query, [start, end]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching ingredient usage:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
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
