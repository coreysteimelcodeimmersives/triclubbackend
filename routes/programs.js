var express = require("express");
var router = express.Router();
const dotenv = require("dotenv");
const { triclubDb } = require("../mongo");
const { env } = require("process");
const { uuid } = require("uuidv4");
const jwt = require("jsonwebtoken");
dotenv.config();
const { serverCheckProgramInfoIsValid } = require("../utils/validation");
const { findUserByKey } = require("./users");

/* GET all programs. */
router.get("/get-all-programs", async (req, res) => {
  try {
    const collection = await triclubDb().collection("programs");
    const programsArr = await collection.find({}).toArray();
    // console.log(programsArr);
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
    // console.log("programsArr: " + programsArr);
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

/* Delete program. */
router.get("/delete-program", async (req, res) => {
  try {
    const uid = req.headers.uid;
    console.log(uid);
    const collection = await triclubDb().collection("programs");
    const deleteRes = await collection.deleteOne({ uid: uid });

    if (!deleteRes.acknowledged) {
      return res.status(500).json({ success: false, message: "unsuccessful" });
    }
    res.status(200).json({ success: true, message: deleteRes.acknowledged });
  } catch (error) {
    return res.status(500).json({ success: false, message: String(error) });
  }
});

router.post("/submit-program", async (req, res) => {
  try {
    const programIsValid = serverCheckProgramInfoIsValid(req.body);
    if (!programIsValid) {
      res.status(403).json({
        success: false,
        message: "Enter valid program data.",
      });
      return;
    }
    const collection = await triclubDb().collection("programs");
    const programData = req.body;
    const program = { ...programData, uid: uuid() };
    await collection.insertOne(program);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});


router.post("/edit-program", async (req, res) => {
  try {
    const collection = await triclubDb().collection("programs");
    const programData = req.body.programData;
    const uid = req.body.uid;
    const program = { ...programData, uid: uid };
    await collection.updateOne(
      { uid: uid },
      {
        $set: program,
      }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: error });
  }
});

// REVIST THIS LATER. FOR NOW WE HAVE DATA AND CAN GET EVERYTHING.
// router.put("/add-athlete", async (req, res) => {
//   try {
//     const token = req.headers.token;
//     const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
//     if (!token) {
//       return res
//         .status(500)
//         .json({ success: false, message: "no jwt token exists" });
//     }
//     const verified = jwt.verify(token, jwtSecretKey);
//     const userObj = await findUserByKey("uid", verified.userId);
//     if (!userObj.success) {
//       res.status(406).json({
//         success: false,
//         message: "We did not find your account.",
//       });
//       return;
//     }
//     const user = userObj.user;
//   } catch (error) {}
// });


module.exports = router;
