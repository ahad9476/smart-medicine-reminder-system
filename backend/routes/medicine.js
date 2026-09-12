const express = require("express");

const router = express.Router();

const {
    createMedicine,
    getMedicines,
    updateMedicine,
    deleteMedicine
} = require("../controllers/medicineController");

router.post("/medicines", createMedicine);

router.get("/medicines", getMedicines);

router.put("/medicines/:id", updateMedicine);

router.delete("/medicines/:id", deleteMedicine);

module.exports = router;