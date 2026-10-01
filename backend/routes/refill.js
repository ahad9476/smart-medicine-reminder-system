const express = require("express");

const router = express.Router();

const { addRefill, getRefills } = require("../controllers/refillController");

router.post("/refills", addRefill);

router.get("/refills", getRefills);

module.exports = router;
