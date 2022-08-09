const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const { uuid } = require("uuidv4");
const { triclubDb } = require("../mongo");
const {
  serverCheckUserIsValid,
  serverCheckEmailIsValid,
} = require("../utils/validation");
const { env } = require("process");

dotenv.config();

// Heroku
// const urlEndpoint = process.env.REACT_APP_DATABASE_URL;

//LOCAL
const urlEndpoint = process.env.REACT_APP_URL_ENDPOINT;

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

const checkUniqueEmail = async (email) => {
  try {
    const collection = await triclubDb().collection("users");
    const user = await collection.findOne({
      email: email,
    });
    if (user) {
      console.log("email in use");
      const obj = { success: false, message: "Email already in use." };
      return obj;
    }
    return { success: true };
  } catch (error) {
    return false;
  }
};

router.post("/sign-up-user", async (req, res) => {
  try {
    const userIsValid = serverCheckUserIsValid(req.body);
    if (!userIsValid) {
      console.log("user is not valid");
      res.json({
        success: false,
        message: "Enter valid email & password.",
      });
      return;
    }
    const email = req.body.email;
    const uniqueEmail = await checkUniqueEmail(email);
    if (!uniqueEmail.success) {
      console.log("email in use. block");
      console.log(uniqueEmail.message);
      res.json(uniqueEmail).status(204);
      return;
    }
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

const findUser = async (email) => {
  try {
    const collection = await triclubDb().collection("users");
    const user = await collection.findOne({
      email: email,
    });
    if (!user) {
      return { success: false };
    }
    console.log("find user");
    console.log(user);
    return { success: true, user: user };
  } catch (error) {
    return error;
  }
};

router.post("/login-user", async (req, res) => {
  try {
    const userIsValid = serverCheckUserIsValid(req.body);
    if (!userIsValid) {
      console.log("user is not valid");
      res.json({
        success: false,
        message: "Enter valid email & password.",
      });
      return;
    }
    const email = req.body.email;
    console.log(email);
    const password = req.body.password;
    console.log(password);
    const findUserObj = await findUser(email);
    if (!findUserObj.success) {
      res
        .json({
          success: false,
          message: "We did not find that email, please try again.",
        })
        .status(204);
      return;
    }
    const user = findUserObj.user;
    console.log("log in user func");
    console.log(user);
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

router.post("/forgot-password", async (req, res) => {
  try {
    const emailIsValid = serverCheckEmailIsValid(req.body);
    if (!emailIsValid) {
      res.json({ success: false, message: "Enter a valid email." });
      return;
    }
    const email = req.body.email;
    const findUserObj = await findUser(email);
    if (!findUserObj.success) {
      res.json({
        success: false,
        message: "We did not find that email, please try again.",
      });
    }
    const user = findUserObj.user;
    const token = crypto.randomBytes(20).toString("hex");
    console.log("token");
    console.log(token);
    const collection = await triclubDb().collection("users");
    var date1 = new Date();
    var dateToMilliseconds = date1.getTime();
    var addedHours = dateToMilliseconds + 3600000;
    //This will add 1 hour1 to our time.
    var newDate = new Date(addedHours);
    //This will create a new date that will be 1 hour1 ahead of the current date
    console.log("date");
    console.log(newDate);

    await collection.updateOne(
      { email: email },
      {
        $set: {
          ...user,
          resetPaswordToken: token,
          resetPssswordExpires: newDate,
        },
      }
    );

    console.log("yo!");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: `${process.env.REACT_APP_EMAIL_ADDRESS}`,
        pass: `${process.env.REACT_APP_EMAIL_PASSWORD}`,
      },
    });

    console.log("before mail options ");

    const mailOptions = {
      from: "trishopoffice@gmail.com",
      to: `${user.email}`,
      subject: `TriClub: Link to Reset Password`,
      text:
        `You are recieving this because you (or someone else) have requested to reset your TriClub account password.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n` +
        `${urlEndpoint}/reset-password/${token}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    console.log("sending email");

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        console.log("there was an error: ", err);
      } else {
        console.log("here is the res: ", response);
        return res.status(200).json({
          success: true,
          message: "Reset Password link sent to your email address.",
        });
      }
    });

    // await nodeMailerFunc();
  } catch (error) {
    console.log(error);
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

module.exports = router;
