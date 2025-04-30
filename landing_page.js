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
    const data = {name: 'LANDING PAGE'};
    res.render('landing_page', data);
});

// POST: Handle Manual Login (employee_id + password)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM employees WHERE employee_id::text = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid credentials');
        }

        const user = result.rows[0];

        req.session.user = {
            id: user.employee_id,
            isManager: user.manager_access
        };

        const isManager = user.manager_access === true || user.manager_access === 't' || user.manager_access === 'true';

        if (isManager) {
            return res.redirect('/manager/reports');
        } else {
            return res.redirect('/cashier');
        }

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;

