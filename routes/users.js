var express = require("express");
var router = express.Router();
const dotenv = require("dotenv");
const { triclubDb } = require("../mongo");
const { env } = require("process");

dotenv.config();

const findUsersByKey = async (key, value) => {
  try {
    const collection = await triclubDb().collection("users");
    const user = await collection
      .find({
        [key]: value,
      })
      .toArray();
    if (!user) {
      return { success: false };
    }

    return { success: true, user: user };
  } catch (error) {
    return error;
  }
};

const findUserByKey = async (key, value) => {
  try {
    const collection = await triclubDb().collection("users");
    const user = await collection.findOne({
      [key]: value,
    });
    if (!user) {
      return { success: false };
    }

    return { success: true, user: user };
  } catch (error) {
    return error;
  }
};

/* GET users listing. */
router.get("/get-pending-coaches", async (req, res) => {
  const val = "coach";
  try {
    const pendingCoaches = await findUsersByKey("userType", "pendingCoach");
    console.log(pendingCoaches.user);

    res.status(200).json({ success: true, users: pendingCoaches.user });
  } catch (error) {
    return res.status(500).json({ success: false, message: String(error) });
  }
});

/* GET users listing. */
router.put("/set-pending-coaches", async (req, res) => {
  const decision = req.body.decision ? "coach" : "user";
  const uid = req.body.uid;
  console.log("req.body.uid: " + req.body.uid);
  console.log("req.body.decision: " + req.body.decision);
  console.log(uid);
  console.log(decision);
  try {
    const collection = await triclubDb().collection("users");
    const findUserObj = await findUserByKey("uid", uid);
    if (!findUserObj.success) {
      res.status(406).json({
        success: false,
        message: "We did not find the user in the database",
      });
    }
    const user = findUserObj.user;

    await collection.updateOne(
      { uid: uid },
      {
        $set: {
          ...user,
          userType: decision,
        },
      }
    );

    res
      .status(200)
      .json({
        success: true,
        message:
          "Coach successfully accepted and assigned 'Coach' access priveledges",
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: String(error) });
  }
});

module.exports = router;
