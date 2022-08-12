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
  serverCheckPasswordIsValid,
  serverCheckCoachInfoIsValid,
} = require("../utils/validation");
const { env } = require("process");

dotenv.config();

router.post("/become-coach", async (req, res) => {
  // *** I NEED TO RE - WORK THIS BC THE USER IS ALREADY LOGGED IN ***
  // *** I NEED TO WRITE VALIDATION FOR THE COACH REQ.BODY ***
  try {
    const coachInfoIsValid = serverCheckCoachInfoIsValid(req.body);
    if (!coachInfoIsValid) {
      res.status(403).json({
        success: false,
        message: "Please enter all application fields.",
      });
      return;
    }
    const coachInfo = req.body;
    const token = req.headers.token;
    const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
    if (!token) {
      return res
        .status(500)
        .json({ success: false, message: "no jwt token exists" });
    }
    const verified = jwt.verify(token, jwtSecretKey);
    const pendingCoachObj = await findUserByKey("uid", verified.userId);
    if (!pendingCoachObj.success) {
      res.status(406).json({
        success: false,
        message: "We did not find your account.",
      });
      return;
    }
    const pendingCoachUser = pendingCoachObj.user;
    const collection = await triclubDb().collection("users");
    await collection.updateOne(
      { uid: verified.userId },
      {
        $set: {
          ...pendingCoachUser,
          userType: "pendingCoach",
          coachInfo: coachInfo,
        },
      }
    );
    return res.status(200).json({
      success: true,
      message:
        "Thank you for applying. We will review your application and be in touch with you shortly.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: String(error) });
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
      const obj = { success: false, message: "Email already in use." };
      return obj;
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: String(error) };
  }
};

const saltHashPassword = async (password) => {
  try {
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return { success: true, hash: hash };
  } catch (error) {
    return { success: false };
  }
};

router.post("/sign-up-user", async (req, res) => {
  try {
    const userIsValid = serverCheckUserIsValid(req.body);
    if (!userIsValid) {
      res.status(403).json({
        success: false,
        message: "Enter valid email & password.",
      });
      return;
    }
    const email = req.body.email;
    const uniqueEmail = await checkUniqueEmail(email);
    if (!uniqueEmail.success) {
      res.status(409).json(uniqueEmail);
      return;
    }
    const password = req.body.password;
    const sPassword = await saltHashPassword(password);
    if (!sPassword.success) {
      return res.status(503).json({
        succes: false,
        message: "There was a problem, please try again.",
      });
    }
    const hash = sPassword.hash;
    const userSaveSuccess = await createUser(email, hash);
    if (!userSaveSuccess) {
      res
        .status(409)
        .json({ succes: false, message: "There was a problem, please" });
    }
    return res.status(200).json({ success: userSaveSuccess });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: error });
  }
});

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

router.post("/login-user", async (req, res) => {
  try {
    const userIsValid = serverCheckUserIsValid(req.body);
    if (!userIsValid) {
      res.status(403).json({
        success: false,
        message: "Enter valid email & password.",
      });
      return;
    }
    const email = req.body.email;
    const password = req.body.password;
    const findUserObj = await findUserByKey("email", email);
    if (!findUserObj.success) {
      res.status(406).json({
        success: false,
        message: "We did not find that email.",
      });
      return;
    }
    const user = findUserObj.user;
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
      const data = {
        time: new Date(),
        userId: user.uid,
        userType: user.userType,
      };
      const token = jwt.sign(data, jwtSecretKey);

      res.status(200).json({ success: true, token: token });
      return;
    }
    return res.status(406).json({
      success: false,
      message: "Wrong email or password.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "There was an error, please try again.",
    });
  }
});

router.put("/forgot-password", async (req, res) => {
  try {
    const emailIsValid = serverCheckEmailIsValid(req.body);
    if (!emailIsValid) {
      res.status(403).json({ success: false, message: "Enter a valid email." });
      return;
    }
    const email = req.body.email;
    const findUserObj = await findUserByKey("email", email);
    if (!findUserObj.success) {
      res.status(406).json({
        success: false,
        message: "We did not find that email, please try again.",
      });
    }
    const user = findUserObj.user;
    const token = crypto.randomBytes(20).toString("hex");

    const collection = await triclubDb().collection("users");
    var date1 = new Date();
    var dateToMilliseconds = date1.getTime();
    var addedHours = dateToMilliseconds + 3600000;
    //This will add 1 hour1 to our time.
    var newDate = new Date(addedHours);
    //This will create a new date that will be 1 hour1 ahead of the current date

    await collection.updateOne(
      { email: email },
      {
        $set: {
          ...user,
          resetPasswordToken: token,
          resetPasswordExpires: newDate,
        },
      }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: `${process.env.REACT_APP_EMAIL_ADDRESS}`,
        pass: `${process.env.REACT_APP_EMAIL_PASSWORD}`,
      },
    });

    const mailOptions = {
      from: "trishopoffice@gmail.com",
      to: `${user.email}`,
      subject: `TriClub: Link to Reset Password`,
      text:
        `You are recieving this because you (or someone else) have requested to reset your TriClub account password.\n\n` +
        `Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n` +
        `${process.env.REACT_APP_URL_ENDPOINT}/reset-password?rpt=${token}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    transporter.sendMail(mailOptions, (err, response) => {
      return res.status(200).json({
        success: true,
        message: "Reset Password link sent to your email address.",
      });
    });
  } catch (error) {
    return res.status(500).json({ success: error });
  }
});

router.get("/validate-reset-password-token", async (req, res) => {
  try {
    const rpt = req.headers.rpt;
    const resetRequestee = await findUserByKey("resetPasswordToken", rpt);
    if (!resetRequestee.success) {
      return res.status(406).json({ success: false });
    }
    if (resetRequestee.success) {
      const user = resetRequestee.user;
      date = new Date();
      expDate = user.resetPasswordExpires;
      if (date.getTime() <= expDate.getTime()) {
        return res.status(200).json({ success: true });
      }
    }

    return res.status(401).json({ success: false });
  } catch (error) {
    return res.status(500).json({ success: false, messge: error });
  }
});

router.put("/reset-password", async (req, res) => {
  try {
    const password = req.body.password;
    const passCheck = serverCheckPasswordIsValid(req.body);
    if (!passCheck) {
      return res
        .status(403)
        .json({ success: false, message: "Not a valid password" });
    }
    const rpt = req.body.rpt;
    const sPassword = await saltHashPassword(password);
    if (!sPassword.success) {
      return res.status(503).json({
        succes: false,
        message: "There was a problem, please try again.",
      });
    }
    const hash = sPassword.hash;
    const resetRequestee = await findUserByKey("resetPasswordToken", rpt);
    if (!resetRequestee.success) {
      res.status(406).json({
        success: false,
        message: "We did not find that user.",
      });
      return;
    }

    const user = resetRequestee.user;
    const updateUser = {
      ...user,
      password: hash,
    };
    const collection = await triclubDb().collection("users");
    await collection.updateOne(
      { resetPasswordToken: rpt },
      {
        $set: {
          ...updateUser,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "password reset success" });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
});

// router.get("/auth/validate-token", (req, res) => {
//   const tokenHeaderKey = process.env.REACT_APP_TOKEN_HEADER_KEY;
//   const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;

//   try {
//     const token = req.header(tokenHeaderKey);

//     const verified = jwt.verify(token, jwtSecretKey);
//     if (verified) {
//       return res.json({ success: true });
//     } else {
//       // Access Denied
//       throw Error("Access Denied");
//     }
//   } catch (error) {
//     // Access Denied
//     return res.status(401).json({ success: true, message: String(error) });
//   }
// });

router.get("/validate-admin", (req, res) => {
  try {
    const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
    const token = req.headers.token;

    if (!token) {
      return res
        .status(500)
        .json({ success: false, message: "no jwt token exists" });
    }

    const verified = jwt.verify(token, jwtSecretKey);

    if (verified && verified.userType === "admin") {
      return res.status(200).json({
        success: true,
        isAdmin: true,
      });
    } else {
      return res.status(200).json({
        success: true,
        isAdmin: false,
        verified: verified.data,
      });
    }
  } catch (error) {
    // Access Denied
    return res.status(500).json({ success: false, message: String(error) });
  }
});

router.get("/validate-coach", (req, res) => {
  try {
    const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
    const token = req.headers.token;

    if (!token) {
      return res
        .status(500)
        .json({ success: false, message: "no jwt token exists" });
    }
    const verified = jwt.verify(token, jwtSecretKey);

    if (verified && verified.userType === "coach") {
      return res.status(200).json({
        success: true,
        isCoach: true,
      });
    } else {
      return res.status(200).json({ success: true, isCoach: false });
    }
  } catch (error) {
    // Access Denied
    return res.status(500).json({ success: false, message: String(error) });
  }
});

module.exports = router;
