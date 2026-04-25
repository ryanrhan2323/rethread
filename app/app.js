const express = require("express");
const session = require("express-session");
const app = express();

const db = require("./services/db");

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true
}));

// make logged-in user available in all templates
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

// ---------------- HOME ----------------
app.get("/", (req, res) => {
    res.render("index");
});

// ---------------- AUTH ----------------
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        await db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, password, role]
        );

        res.redirect("/login");
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).send(error.message);
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const users = await db.query(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            [email, password]
        );

        if (users.length === 0) {
            return res.send("Invalid login");
        }

        req.session.user = users[0];
        res.redirect("/");
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).send(error.message);
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// ---------------- USERS ----------------
app.get("/users", async (req, res) => {
    try {
        const users = await db.query("SELECT * FROM users ORDER BY user_id");
        res.render("users", { users, title: "All Users" });
    } catch (error) {
        console.error("USERS ERROR:", error);
        res.status(500).send(error.message);
    }
});

app.get("/customers", async (req, res) => {
    try {
        const users = await db.query("SELECT * FROM users WHERE role = 'customer' ORDER BY user_id");
        res.render("users", { users, title: "Customers" });
    } catch (error) {
        console.error("CUSTOMERS ERROR:", error);
        res.status(500).send(error.message);
    }
});

app.get("/menders", async (req, res) => {
    try {
        const users = await db.query("SELECT * FROM users WHERE role = 'mender' ORDER BY user_id");
        res.render("users", { users, title: "Menders" });
    } catch (error) {
        console.error("MENDERS ERROR:", error);
        res.status(500).send(error.message);
    }
});

// ---------------- REQUESTS ----------------
app.get("/add-request", (req, res) => {
    if (!req.session.user || req.session.user.role !== "customer") {
        return res.send("Only customers can create requests");
    }

    res.render("add-request");
});

app.post("/add-request", async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== "customer") {
            return res.send("Access denied");
        }

        const { title, description, category, image_url } = req.body;

        await db.query(
            "INSERT INTO repairrequests (user_id, title, description, category, image_url, status) VALUES (?, ?, ?, ?, ?, 'open')",
            [
                req.session.user.user_id,
                title,
                description,
                category,
                image_url || null
            ]
        );

        res.redirect("/listings");
    } catch (error) {
        console.error("ADD REQUEST ERROR:", error);
        res.status(500).send(error.message);
    }
});

app.get("/listings", async (req, res) => {
    try {
        const listings = await db.query(`
            SELECT rr.*, u.name AS customer_name
            FROM repairrequests rr
            JOIN users u ON rr.user_id = u.user_id
            ORDER BY rr.request_id
        `);

        res.render("listings", { listings });
    } catch (error) {
        console.error("LISTINGS ERROR:", error);
        res.status(500).send(error.message);
    }
});

app.get("/listing/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const listingRows = await db.query(`
            SELECT rr.*, u.name AS customer_name
            FROM repairrequests rr
            JOIN users u ON rr.user_id = u.user_id
            WHERE rr.request_id = ?
        `, [id]);

        if (listingRows.length === 0) {
            return res.send("Listing not found");
        }

        const offers = await db.query(`
            SELECT o.*, u.name AS mender_name
            FROM offers o
            JOIN users u ON o.mender_id = u.user_id
            WHERE o.request_id = ?
            ORDER BY o.offer_id
        `, [id]);

        res.render("listing", {
            listing: listingRows[0],
            offers
        });
    } catch (error) {
        console.error("LISTING DETAIL ERROR:", error);
        res.status(500).send(error.message);
    }
});

// ---------------- OFFERS ----------------
app.get("/add-offer/:requestId", (req, res) => {
    if (!req.session.user || req.session.user.role !== "mender") {
        return res.send("Only menders can add offers");
    }

    res.render("add-offer", { requestId: req.params.requestId });
});

app.post("/add-offer", async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== "mender") {
            return res.send("Access denied");
        }

        const { request_id, price, message } = req.body;

        await db.query(
            "INSERT INTO offers (request_id, mender_id, price, message, status) VALUES (?, ?, ?, ?, 'pending')",
            [request_id, req.session.user.user_id, price, message]
        );

        res.redirect(`/listing/${request_id}`);
    } catch (error) {
        console.error("ADD OFFER ERROR:", error);
        res.status(500).send(error.message);
    }
});

// only request owner or admin can accept
app.get("/accept-offer/:offerId/:requestId", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login");
        }

        const { offerId, requestId } = req.params;

        const requestRows = await db.query(
            "SELECT user_id FROM repairrequests WHERE request_id = ?",
            [requestId]
        );

        if (requestRows.length === 0) {
            return res.send("Request not found");
        }

        const requestOwnerId = requestRows[0].user_id;

        if (
            req.session.user.role !== "admin" &&
            req.session.user.user_id !== requestOwnerId
        ) {
            return res.send("Access denied");
        }

        await db.query(
            "UPDATE offers SET status = 'rejected' WHERE request_id = ?",
            [requestId]
        );

        await db.query(
            "UPDATE offers SET status = 'accepted' WHERE offer_id = ?",
            [offerId]
        );

        res.redirect(`/listing/${requestId}`);
    } catch (error) {
        console.error("ACCEPT OFFER ERROR:", error);
        res.status(500).send(error.message);
    }
});

// mender who made the offer, request owner, or admin can delete
app.get("/delete-offer/:offerId/:requestId", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login");
        }

        const { offerId, requestId } = req.params;

        const offerRows = await db.query(
            "SELECT mender_id FROM offers WHERE offer_id = ?",
            [offerId]
        );

        const requestRows = await db.query(
            "SELECT user_id FROM repairrequests WHERE request_id = ?",
            [requestId]
        );

        if (offerRows.length === 0 || requestRows.length === 0) {
            return res.send("Data not found");
        }

        const menderId = offerRows[0].mender_id;
        const customerId = requestRows[0].user_id;

        if (
            req.session.user.role !== "admin" &&
            req.session.user.user_id !== menderId &&
            req.session.user.user_id !== customerId
        ) {
            return res.send("Access denied");
        }

        await db.query("DELETE FROM offers WHERE offer_id = ?", [offerId]);

        res.redirect(`/listing/${requestId}`);
    } catch (error) {
        console.error("DELETE OFFER ERROR:", error);
        res.status(500).send(error.message);
    }
});

// request owner or admin can delete request
app.get("/delete-request/:requestId", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login");
        }

        const { requestId } = req.params;

        const requestRows = await db.query(
            "SELECT user_id FROM repairrequests WHERE request_id = ?",
            [requestId]
        );

        if (requestRows.length === 0) {
            return res.send("Request not found");
        }

        const requestOwnerId = requestRows[0].user_id;

        if (
            req.session.user.role !== "admin" &&
            req.session.user.user_id !== requestOwnerId
        ) {
            return res.send("Access denied");
        }

        await db.query("DELETE FROM offers WHERE request_id = ?", [requestId]);
        await db.query("DELETE FROM repairrequests WHERE request_id = ?", [requestId]);

        res.redirect("/listings");
    } catch (error) {
        console.error("DELETE REQUEST ERROR:", error);
        res.status(500).send(error.message);
    }
});

// ---------------- PROFILE ----------------
app.get("/profile/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const userRows = await db.query(
            "SELECT * FROM users WHERE user_id = ?",
            [id]
        );

        if (userRows.length === 0) {
            return res.send("User not found");
        }

        const user = userRows[0];
        let data = [];

        if (user.role === "customer") {
            data = await db.query(
                "SELECT * FROM repairrequests WHERE user_id = ? ORDER BY request_id",
                [id]
            );
        }

        if (user.role === "mender") {
            data = await db.query(`
                SELECT o.*, rr.title
                FROM offers o
                JOIN repairrequests rr ON o.request_id = rr.request_id
                WHERE o.mender_id = ?
                ORDER BY o.offer_id
            `, [id]);
        }

        res.render("profile", { user, data });
    } catch (error) {
        console.error("PROFILE ERROR:", error);
        res.status(500).send(error.message);
    }
});
app.get("/change-avatar/:avatar", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login");
        }

        const avatar = req.params.avatar;

        await db.query(
            "UPDATE users SET avatar = ? WHERE user_id = ?",
            [avatar, req.session.user.user_id]
        );

        // обновляем сессию
        req.session.user.avatar = avatar;

        res.redirect(`/profile/${req.session.user.user_id}`);
    } catch (error) {
        console.error("CHANGE AVATAR ERROR:", error);
        res.status(500).send(error.message);
    }
});

app.listen(3000, () => {
    console.log("http://localhost:3000");
});