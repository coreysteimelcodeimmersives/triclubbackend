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


router.post("/submit-program", async (req, res) => {
  try {
    // const programIsValid = serverCheckProgramIsValid(req.body);
    // if (!programIsValid) {
    //   res.status(403).json({
    //     success: false,
    //     message: "Enter valid program data.",
    //   });
    //   return;
    // }
    const collection = await triclubDb().collection("programs");
    const programData = req.body;
    const program = { ...programData, uid: uuid() };
    await collection.insertOne(program);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: error });
  }
});

module.exports = router;
