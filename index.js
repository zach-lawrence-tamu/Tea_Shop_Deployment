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
        if (!req.user) {
            console.error("No user found after OAuth login.");
            return res.redirect('/');
        }
    
        // Normalize isManager just in case
        const isManager = req.user.isManager === true || req.user.isManager === 't';
    
        if (isManager) {
            return res.redirect('/manager/reports');
        } else {
            return res.redirect('/cashier');
        }
    }
);

// Logout route
app.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.session.destroy(() => {
            // Redirect to Google's logout, then return to homepage
            res.redirect('https://accounts.google.com/Logout?continue=https://appengine.google.com/_ah/logout?continue=https://tea-shop-deployment.onrender.com');
        });
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


    

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
