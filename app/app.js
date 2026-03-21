// Import express.js
const express = require("express");

// Create express app
var app = express();

// Set up Pug
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require("./services/db");

// Route for root - /
app.get("/", function(req, res) {
    res.send("Hello world!");
});

// Users list page
app.get("/users", async function(req, res) {
    try {
        const sql = "SELECT * FROM users";
        const users = await db.query(sql);
        res.render("users", { users: users });
    } catch (error) {
        console.error("USERS ERROR:", error);
        res.status(500).send(error.message);
    }
});

// All repair listings page
app.get("/listings", async function(req, res) {
    try {
        const sql = "SELECT * FROM repairrequests";
        const listings = await db.query(sql);
        res.render("listings", { listings: listings });
    } catch (error) {
        console.error("LISTINGS ERROR:", error);
        res.status(500).send(error.message);
    }
});

// Filter listings by category
app.get("/listings/filter/:category", async function(req, res) {
    try {
        const category = req.params.category;
        const sql = "SELECT * FROM repairrequests WHERE category = ?";
        const listings = await db.query(sql, [category]);
        res.render("listings", { listings: listings });
    } catch (error) {
        console.error("FILTER ERROR:", error);
        res.status(500).send(error.message);
    }
});

// Single listing detail page
app.get("/listing/:id", async function(req, res) {
    try {
        const id = req.params.id;
        const sql = "SELECT * FROM repairrequests WHERE request_id = ?";
        const data = await db.query(sql, [id]);
        res.render("listing", { listing: data[0] });
    } catch (error) {
        console.error("DETAIL ERROR:", error);
        res.status(500).send(error.message);
    }
});

// Single user profile page
app.get("/profile/:id", async function(req, res) {
    try {
        const id = req.params.id;
        const sql = "SELECT * FROM users WHERE user_id = ?";
        const data = await db.query(sql, [id]);
        res.render("profile", { user: data[0] });
    } catch (error) {
        console.error("PROFILE ERROR:", error);
        res.status(500).send(error.message);
    }
});

// Route for /goodbye
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Dynamic route for /hello/<name>
app.get("/hello/:name", function(req, res) {
    console.log(req.params);
    res.send("Hello " + req.params.name);
});

// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000/`);
});