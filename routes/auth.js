var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const { uuid } = require("uuidv4");
const { triClubDb } = require("../mongo");

const createClub = async (clubName, passwordHash) => {
  try {
    const collection = await clubsDB().collection("clubs");
    const club = {
      clubName: clubName,
      password: passwordHash,
      uid: uuid(),
    };
    await collection.insertOne(club);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

router.post("/register-club", async (req, res) => {
  try {
    const clubName = req.body.clubName;
    const password = req.body.password;
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    const clubSaveSuccess = await createClub(clubName, hash);
    res.json({ success: clubSaveSuccess }).status(200);
  } catch (error) {
    console.error(error);
    res.json({ success: error }).status(500);
  }
});

module.exports = router;
