var express = require("express");
var router = express.Router();
const dotenv = require("dotenv");
const { triclubDb } = require("../mongo");
const { env } = require("process");
const { uuid } = require("uuidv4");

dotenv.config();

/* GET all programs. */
router.get("/get-all-programs", async (req, res) => {
  try {
    const collection = await triclubDb().collection("programs");
    const programsArr = await collection.find({}).toArray();
    console.log(programsArr);
    if (!programsArr) {
      return res
        .status(500)
        .json({ success: false, message: "No programs found" });
    }

    res.status(200).json({ success: true, programs: programsArr });
  } catch (error) {
    return res.status(500).json({ success: false, message: String(error) });
  }
});

/* GET all programs. */
router.get("/get-active-programs", async (req, res) => {
  try {
    const collection = await triclubDb().collection("programs");
    const programsArr = await collection.find({ isActive: true }).toArray();
    console.log("programsArr: " + programsArr);
    if (!programsArr) {
      return res
        .status(500)
        .json({ success: false, message: "No programs found" });
    }

    res.status(200).json({ success: true, programs: programsArr });
  } catch (error) {
    return res.status(500).json({ success: false, message: String(error) });
  }
});

module.exports = router;
