
const db = require("../db/connection");

// Get caregivers assigned to a patient
const getCaregivers = (req, res) => {
    const userId = Number(req.query.user_id);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            message: "Valid user_id is required"
        });
    }

    const sql = `
        SELECT
            ca.assignment_id,
            ca.caregiver_id,
            ca.caregiver_user_id,
            c.name,
            c.email,
            c.phone,
            ca.relationship,
            account.email AS account_email
        FROM caregiver_assignments ca
        JOIN caregivers c
            ON c.caregiver_id = ca.caregiver_id
        LEFT JOIN Users account
            ON account.user_id = ca.caregiver_user_id
        WHERE ca.user_id = ?
        ORDER BY c.name ASC
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("GET CAREGIVERS ERROR:", err);
            return res.status(500).json({
                message: "Failed to fetch caregivers"
            });
        }

        res.json(rows);
    });
};


// Assign a registered caregiver using their email
const addCaregiver = (req, res) => {
    const patientId = Number(req.body.user_id);
    const email = String(req.body.email || "")
        .trim()
        .toLowerCase();

    const relationship =
        String(req.body.relationship || "").trim() || null;

    const phone =
        String(req.body.phone || "").trim() || null;

    if (!Number.isInteger(patientId) || patientId <= 0 || !email) {
        return res.status(400).json({
            message: "Patient ID and caregiver email are required"
        });
    }

    // Find registered caregiver account
    db.query(
        "SELECT user_id, name, email, role FROM Users WHERE LOWER(email) = ? LIMIT 1",
        [email],
        (err, users) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Could not find caregiver account"
                });
            }

            if (!users.length || users[0].role !== "caregiver") {
                return res.status(404).json({
                    message: "No registered caregiver account found. Ask them to register with the Caregiver role first."
                });
            }

            const account = users[0];

            // Verify patient account
            db.query(
                "SELECT user_id FROM Users WHERE user_id = ? AND role = 'patient' LIMIT 1",
                [patientId],
                (patientErr, patients) => {
                    if (patientErr) {
                        console.error(patientErr);
                        return res.status(500).json({
                            message: "Could not verify patient account"
                        });
                    }

                    if (!patients.length) {
                        return res.status(400).json({
                            message: "Patient account was not found"
                        });
                    }

                    // Prevent duplicate assignment
                    db.query(
                        `SELECT assignment_id
                         FROM caregiver_assignments
                         WHERE user_id = ? AND caregiver_user_id = ?
                         LIMIT 1`,
                        [patientId, account.user_id],
                        (dupErr, existing) => {
                            if (dupErr) {
                                console.error(dupErr);
                                return res.status(500).json({
                                    message: "Could not check existing assignment"
                                });
                            }

                            if (existing.length) {
                                return res.status(409).json({
                                    message: "This caregiver is already assigned"
                                });
                            }

                            // Reuse caregiver contact if it exists
                            db.query(
                                "SELECT caregiver_id FROM caregivers WHERE LOWER(email) = ? LIMIT 1",
                                [email],
                                (contactErr, contacts) => {
                                    if (contactErr) {
                                        console.error(contactErr);
                                        return res.status(500).json({
                                            message: "Could not find caregiver contact"
                                        });
                                    }

                                    const createAssignment = (caregiverId) => {
                                        const insertSql = `
                                            INSERT INTO caregiver_assignments
                                            (user_id, caregiver_id, caregiver_user_id, relationship)
                                            VALUES (?, ?, ?, ?)
                                        `;

                                        db.query(
                                            insertSql,
                                            [
                                                patientId,
                                                caregiverId,
                                                account.user_id,
                                                relationship
                                            ],
                                            (insertErr, result) => {
                                                if (insertErr) {
                                                    console.error(insertErr);
                                                    return res.status(500).json({
                                                        message: "Failed to assign caregiver"
                                                    });
                                                }

                                                res.status(201).json({
                                                    message: `${account.name} assigned successfully`,
                                                    assignment_id: result.insertId
                                                });
                                            }
                                        );
                                    };

                                    if (contacts.length) {
                                        return createAssignment(
                                            contacts[0].caregiver_id
                                        );
                                    }

                                    // Create caregiver contact
                                    db.query(
                                        "INSERT INTO caregivers (name, email, phone) VALUES (?, ?, ?)",
                                        [account.name, account.email, phone],
                                        (createErr, result) => {
                                            if (createErr) {
                                                console.error(createErr);
                                                return res.status(500).json({
                                                    message: "Failed to create caregiver contact"
                                                });
                                            }

                                            createAssignment(result.insertId);
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};


// Remove caregiver assignment
const removeCaregiverAssignment = (req, res) => {
    const assignmentId = Number(req.params.id);
    const patientId = Number(req.query.user_id);

    if (!Number.isInteger(assignmentId) || !Number.isInteger(patientId)) {
        return res.status(400).json({
            message: "Assignment and patient IDs are required"
        });
    }

    db.query(
        "DELETE FROM caregiver_assignments WHERE assignment_id = ? AND user_id = ?",
        [assignmentId, patientId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to remove caregiver"
                });
            }

            if (!result.affectedRows) {
                return res.status(404).json({
                    message: "Assignment not found"
                });
            }

            res.json({
                message: "Caregiver assignment removed"
            });
        }
    );
};

module.exports = {
    getCaregivers,
    addCaregiver,
    removeCaregiverAssignment
};