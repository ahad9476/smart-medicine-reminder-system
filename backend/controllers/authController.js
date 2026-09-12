const bcrypt = require("bcrypt");
const db = require("../db/connection");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        // Check whether email already exists
        const checkSql = "SELECT * FROM Users WHERE email = ?";

        db.query(checkSql, [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    message: "Email already exists"
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            const insertSql = `
                INSERT INTO Users (name, email, password, role)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [name, email, hashedPassword, "patient"],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Failed to register user"
                        });
                    }

                    res.status(201).json({
                        message: "User registered successfully",
                        user_id: result.insertId
                    });
                }
            );
        });

    } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
        message: "Server error",
        error: error.message
    });
}
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user by email
        const sql = "SELECT * FROM Users WHERE email = ?";

        db.query(sql, [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            // User not found
            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const user = results[0];

            // Compare password
            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            // Login successful
            res.status(200).json({
                message: "Login successful",
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login
};

