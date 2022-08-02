const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const { uuid } = require("uuidv4");
const { triClubDb } = require("../mongo");

dotenv.config();

const createUser = async (username, passwordHash) => {
  try {
    const collection = await triClubDb().collection("users");
    const user = {
      username: username,
      password: passwordHash,
      uid: uuid(),
    };
    await collection.insertOne(user);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

router.post("/register-user", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    const userSaveSuccess = await createUser(username, hash);
    res.json({ success: userSaveSuccess }).status(200);
  } catch (error) {
    console.error(error);
    res.json({ success: error }).status(500);
  }
});

router.post("/login-user", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const collection = await triClubDb().collection("users");
    const user = await collection.findOne({
      username: username,
    });
    if (!user) {
      res.json({ success: false }).status(204);
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const jwtSecretKey = process.env.JWT_SECRET_KEY;
      const data = {
        time: new Date(),
        userId: user.uid,
      };
      const token = jwt.sign(data, jwtSecretKey);
      res.json({ success: match, token: token }).status(200);
      return;
    }
    res.json({ success: false }).status(204);
  } catch (error) {
    res.json({ success: error }).status(500);
  }
});

router.get("/auth/validate-token", (req, res) => {
  const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  try {
    const token = req.header(tokenHeaderKey);

    const verified = jwt.verify(token, jwtSecretKey);
    if (verified) {
      return res.json({ success: true });
    } else {
      // Access Denied
      throw Error("Access Denied");
    }
  } catch (error) {
    // Access Denied
    return res.status(401).json({ success: true, message: String(error) });
  }
});

module.exports = router;
