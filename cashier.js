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

router.get('/', async (req, res) => {
    try{
        const[all_menu_items, all_addons, all_flavors] = await Promise.all([
            pool.query('SELECT name, price FROM valid_tea_types'),
            pool.query('SELECT name, price FROM valid_addons'),
            pool.query('SELECT name FROM valid_flavors')
        ])

        const data = {
            menu_items: all_menu_items.rows,
            addons: all_addons.rows,
            flavors: all_flavors.rows,

            };

        res.render('cashier_order_page', data);
    }catch(e){
        console.error("Database query error:", e);
        res.status(500).send("Internal Server Error");
    }
});


router.get('/orders', (req, res) => {
    let order_data = []
    const limit = 20;
    const offset = parseInt(req.query.offset) || 0;
    pool
        .query('SELECT id, time, date, cost FROM orders ORDER BY date DESC, time DESC LIMIT $1 OFFSET $2', [limit, offset])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                order_data.push(query_res.rows[i]);
            }
            const data = {
                order_data: order_data,
                hasMore: query_res.rowCount === limit,
                nextOffset: offset + limit
            };
            console.log(order_data);
            res.render('orders', data);
        });
});

router.get('/transactions', async (req, res) => {
    let trans = []
    const limit = 5000;
    const offset = parseInt(req.query.offset) || 0;
    const totalResult = await pool.query('SELECT COUNT(*) FROM orders');
    const totalOrders = parseInt(totalResult.rows[0].count);
    
    pool
        .query('SELECT * FROM orders ORDER BY date DESC, time DESC LIMIT $1 OFFSET $2', [limit, offset])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                trans.push(query_res.rows[i]);
            }
            const data = {
                trans: trans,
                hasMore: query_res.rowCount === limit,
                nextOffset: offset + limit,
                totalOrders: totalOrders,
                currentOffset: offset
            };
            //const data = {trans: trans};
            console.log(trans);
            res.render('transactions', data);
        });
});

router.get('/checkout', async(req, res)=>{
    const data = {name: 'checkout'};
    res.render('checkout', data);
});

/*DATABASE FINALIZED ORDER UPDATE*/

router.post("/submit-order", async (req, res) => {
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
          price: totalCostx
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
module.exports = router;