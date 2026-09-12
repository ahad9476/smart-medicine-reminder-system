require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db/connection");

const authRoutes = require("./routes/auth");
const medicineRoutes = require("./routes/medicine");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", medicineRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Smart Medicine Reminder System Backend is running!"
    });
});

app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1 AS test", (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database connection failed"
            });
        }

        res.json({
            message: "Database connection successful!",
            result: results
        });
    });
});

app.get("/api/test-users", (req, res) => {
    const sql = "SELECT * FROM Users";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to fetch users"
            });
        }

        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});