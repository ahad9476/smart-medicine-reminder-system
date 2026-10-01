
const express = require("express");
const router = express.Router();

const {
    getAssignedPatients,
    getPatientOverview
} = require("../controllers/caregiverDashboardController");

router.get(
    "/caregiver/patients",
    getAssignedPatients
);

router.get(
    "/caregiver/patients/:patientId",
    getPatientOverview
);

module.exports = router;