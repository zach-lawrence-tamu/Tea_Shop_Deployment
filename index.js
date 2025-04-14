const express = require('express'), 
manager = require('./manager.js'), 
landing = require('./landing_page.js'),
customer = require('./customer.js'),
cashier = require('./cashier.js');
const path = require('path');

// Create express app
const app = express();
const port = 3000;

app.use(express.static('public'));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'views')));
app.use('/', landing);
app.use('/manager', manager);
app.use('/customer', customer);
app.use('/cashier', cashier);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});