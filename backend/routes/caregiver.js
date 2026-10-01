const express = require("express");

const router = express.Router();

const {
    getCaregivers,
    addCaregiver,
    removeCaregiverAssignment
} = require("../controllers/caregiverController");

router.get("/caregivers", getCaregivers);

router.post("/caregivers", addCaregiver);

router.delete("/caregivers/assignment/:id", removeCaregiverAssignment);

module.exports = router;
