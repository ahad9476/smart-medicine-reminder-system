const db = require("../db/connection");

const createMedicine = (req, res) => {
    const { user_id, name, description, dosage } = req.body;

    // Check required fields
    if (!user_id || !name) {
        return res.status(400).json({
            message: "User ID and medicine name are required"
        });
    }

    const sql = `
        INSERT INTO Medicines
        (user_id, name, description, dosage)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [user_id, name, description || null, dosage || null],
        (err, result) => {
            if (err) {
                console.error("CREATE MEDICINE ERROR:", err);

                return res.status(500).json({
                    message: "Failed to create medicine"
                });
            }

            res.status(201).json({
                message: "Medicine created successfully",
                medicine_id: result.insertId
            });
        }
    );
};
const getMedicines = (req, res) => {
    const sql = "SELECT * FROM Medicines";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("GET MEDICINES ERROR:", err);

            return res.status(500).json({
                message: "Failed to fetch medicines"
            });
        }

        res.status(200).json(results);
    });
};
const updateMedicine = (req, res) => {
    const medicineId = req.params.id;
    const { name, description, dosage } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Medicine name is required"
        });
    }

    const sql = `
        UPDATE Medicines
        SET name = ?, description = ?, dosage = ?
        WHERE medicine_id = ?
    `;

    db.query(
        sql,
        [name, description || null, dosage || null, medicineId],
        (err, result) => {
            if (err) {
                console.error("UPDATE MEDICINE ERROR:", err);

                return res.status(500).json({
                    message: "Failed to update medicine"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Medicine not found"
                });
            }

            res.status(200).json({
                message: "Medicine updated successfully"
            });
        }
    );
};
const deleteMedicine = (req, res) => {
    const medicineId = req.params.id;

    const sql = `
        DELETE FROM Medicines
        WHERE medicine_id = ?
    `;

    db.query(sql, [medicineId], (err, result) => {
        if (err) {
            console.error("DELETE MEDICINE ERROR:", err);

            return res.status(500).json({
                message: "Failed to delete medicine"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Medicine not found"
            });
        }

        res.status(200).json({
            message: "Medicine deleted successfully"
        });
    });
};
module.exports = {
    createMedicine,
    getMedicines,
    updateMedicine,
    deleteMedicine
};