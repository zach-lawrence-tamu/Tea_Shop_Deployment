const express = require('express'), manager = require('./manager.js');

// Create express app
const app = express();
const port = 3000;
	 	 	 	
app.set("view engine", "ejs");
app.use('/', manager);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
