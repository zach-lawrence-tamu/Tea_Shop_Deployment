const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Pool } = require('pg');
require('dotenv').config();

// Define pool locally (same style as your route files)
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: { rejectUnauthorized: false }
});

// Passport session serialization
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;

        const result = await pool.query(
            'SELECT * FROM employees WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('User not found in employees table');
            return done(null, false);
        }

        const employee = result.rows[0];
        return done(null, {
            email: email,
            id: employee.employee_id,
            isManager: employee.manager_access
        });

    } catch (err) {
        console.error('Error during authentication:', err);
        return done(err, null);
    }
}));