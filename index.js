const express = require('express');
const manager = require('./manager.js');

// Create express app
const app = express();
const port = 3000;

// Set view engine
app.set("view engine", "ejs");

// Define a route for landing_page.ejs
app.get('/', (req, res) => {
    res.render('landing_page'); // This will render landing_page.ejs
});

// Include manager routes
app.use('/manager', manager);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});