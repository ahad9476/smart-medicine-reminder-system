const express = require("express");

const router = express.Router();

const {
    createCompliance,
    markDose,
    getCompliance
} = require("../controllers/complianceController");

// The button-driven endpoint - "Mark Taken" / "Skip" on the dashboard.
router.post("/compliance/mark", markDose);

// Manual/advanced insert (e.g. backdating a record).
router.post("/compliance", createCompliance);

router.get("/compliance", getCompliance);

module.exports = router;
