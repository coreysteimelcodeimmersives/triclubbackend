const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const { uuid } = require("uuidv4");
const { triclubDb } = require("../mongo");

dotenv.config();

const saltHashPassword = async (password) => {
  try {
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return { success: true, hash: hash };
  } catch (error) {
    return { success: false, message: error };
  }
};

const becomePendingCoach = async (coachObj, hash) => {
  try {
    const collection = await triclubDb().collection("users");
    const newCoach = {
      ...coachObj,
      uuid: uuid(),
      userType: "pendingCoach",
      password: hash,
    };
    await collection.insertOne(newCoach);
    return { success: true, coach: newCoach };
  } catch (error) {
    console.log(error);
    return false;
  }
};

router.post("/become-coach", async (req, res) => {
  try {
    const coachObj = req.body;
    const sPassword = await saltHashPassword(coachObj.password);
    let isPendingCoach = { success: false, coach: {} };

    if (sPassword.success) {
      isPendingCoach = await becomePendingCoach(coachObj, sPassword.hash);
    }
    if (isPendingCoach.success) {
      return res
        .json({
          success: isPendingCoach.success,
          coach: isPendingCoach.coach,
        })
        .status(200);
    }
    return;
  } catch (error) {
    console.log(error);
    return res.json({ success: error }).status(500);
  }
});

const createUser = async (email, passwordHash) => {
  try {
    const collection = await triclubDb().collection("users");
    const user = {
      email: email,
      password: passwordHash,
      uid: uuid(),
      userType: "user",
    };
    await collection.insertOne(user);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

router.post("/sign-up-user", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    const userSaveSuccess = await createUser(email, hash);
    res.json({ success: userSaveSuccess }).status(200);
  } catch (error) {
    console.error(error);
    return res.json({ success: error }).status(500);
  }
});

router.post("/login-user", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const collection = await triclubDb().collection("users");
    const user = await collection.findOne({
      email: email,
    });
    if (!user) {
      res.json({ success: false }).status(204);
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
      const data = {
        time: new Date(),
        userId: user.uid,
      };
      const userType = user.userType;
      const token = jwt.sign(data, jwtSecretKey);
      console.log(token);
      res.json({ success: true, token: token, userType: userType }).status(200);
      return;
    }
    res.json({ success: false }).status(204);
  } catch (error) {
    return res.json({ success: error }).status(500);
  }
});

router.get("/auth/validate-token", (req, res) => {
  const tokenHeaderKey = process.env.REACT_APP_TOKEN_HEADER_KEY;
  const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;

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

// let's go Brandon!
module.exports = router;
