require('dotenv').config();
const express = require('express'), 
manager = require('./manager.js'), 
landing = require('./landing_page.js'),
customer = require('./customer.js'),
cashier = require('./cashier.js');


// API OAUTH
const passport = require('passport');
const session = require('express-session');
require('./auth');
// API OAUTH


const path = require('path');

// Create express app
const app = express();
const port = 3000;

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Session + Passport setup
app.use(session({
    secret: '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',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// Session + Passport setup

/*GENERAL SETUP OF VIEWS*/
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'views')));
app.use('/', landing);
app.use('/manager', manager);
app.use('/customer', customer);
app.use('/cashier', cashier);



/*API SETUP*/

// Google OAuth2 auth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Redirect based on manager flag from `employees` table
        if (req.user.isManager === true || req.user.isManager === 't') {
            return res.redirect('/manager/reports');
        } else {
            return res.redirect('/cashier');
        }
    }
);

// Logout route
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});
// Google OAuth2 auth routes

// weather API
const axios = require('axios');

app.get('/weather', async (req, res) => {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const city = 'College Station';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        const response = await axios.get(url);
        console.log('OpenWeather API Response:', response.data); // 👈 ADD THIS!

        const weather = response.data;

        res.json({
            temperature: weather.main.temp,
            weatherDescription: weather.weather[0].description
        });
    } catch (error) {
        console.error('Weather API error:', error.message);
        res.status(500).json({ error: 'Unable to fetch weather' });
    }
});
// weather API

/*DATABASE FINALIZED ORDER UPDATE*/

app.post("/submit-order", async (req, res) => {
    const client = await pool.connect();
  
    try {
        const { items, tip, date } = req.body;
  
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).send("No order items submitted.");
    }
  
    const now = new Date(date || Date.now());
    const sDate = now.toISOString().split("T")[0];  // YYYY-MM-DD
    const sTime = now.toTimeString().split(" ")[0]; // HH:MM:SS
  
    let newOrderID = await getNextOrderID(client);
    let currOrderNum = await getNextOrderNumber(client); 
  
    for (const item of items) {
        const {
          name: teaType,
          flavor,
          sugar,
          ice,
          quantity,
          addons,
          price: totalCost
        } = item;
  
        const menuPrice = await getMenuPrice(client, teaType); 
        const addonPrice = (parseFloat(totalCost) - menuPrice * quantity).toFixed(2);
  
        // Insert into orders for general data analysis
        await client.query(`
          INSERT INTO orders (
            id, cost, tip, date, time,
            menu_item_price, addon_price,
            flavor, tea_type, quantity, order_number
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `, [
          newOrderID,
          parseFloat(totalCost),
          parseFloat(tip || 0),
          sDate,
          sTime,
          parseFloat(menuPrice),
          parseFloat(addonPrice),
          flavor,
          teaType,
          parseInt(quantity),
          currOrderNum
        ]);
  
        // Insert into menu_item for inventory tracking
        await client.query(`
          INSERT INTO menu_item (
            item_id, flavor, quantity, tea_type,
            sugar_level, ice_level, customer_requests, menu_item_price
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [
          newOrderID,
          flavor,
          parseInt(quantity),
          teaType,
          sugar,
          ice,
          "", 
          parseFloat(menuPrice)
        ]);
  
        const addonFlags = {
          pearls: addons.includes("Pearls"),
          pudding: addons.includes("Pudding"),
          jelly: addons.includes("Jelly"),
          ice_cream: addons.includes("Ice Cream"),
          creama: addons.includes("Creama"),
          boba: addons.includes("Boba")
        };
        // Inest into addon for inventory tracking
        await client.query(`
          INSERT INTO addon (
            item_id, pearls, pudding, jelly,
            ice_cream, creama, boba, addon_price
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [
          newOrderID,
          addonFlags.pearls,
          addonFlags.pudding,
          addonFlags.jelly,
          addonFlags.ice_cream,
          addonFlags.creama,
          addonFlags.boba,
          parseFloat(addonPrice)
        ]);
  
        newOrderID++;
      }
      res.status(200).send("Order submitted successfully.");
    } catch (err) {
      console.error("Order submission error:", err);
      res.status(500).send("Server error while submitting order.");
    } finally {
      client.release();
    }
});
  
 //Helper Functions
async function getMenuPrice(client, teaType) {
    const result = await client.query(
      "SELECT price FROM menu WHERE name = $1",
      [teaType]
    );
    return result.rows[0]?.price || 0;
  }

async function getNextOrderID(client) {
    const result = await client.query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM orders");
    return result.rows[0].next_id;
  }
  
async function getNextOrderNumber(client) {
    const result = await client.query("SELECT COALESCE(MAX(order_number), 0) + 1 AS next_num FROM orders");
    return result.rows[0].next_num;
  }
    

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

