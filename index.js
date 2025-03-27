const express = require('express'), manager = require('./manager.js');
const path = require('path');

// Create express app
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'views')));
app.use('/', manager);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
