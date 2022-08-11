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
} = require("../utils/validation");
const { env } = require("process");

dotenv.config();

// Heroku
// const urlEndpoint = process.env.REACT_APP_DATABASE_URL;

//LOCAL
const urlEndpoint = process.env.REACT_APP_URL_ENDPOINT;

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
  // *** I NEED TO RE - WORK THIS BC THE USER IS ALREADY LOGGED IN ***
  // *** I NEED TO WRITE VALIDATION FOR THE COACH REQ.BODY ***
  try {
    const coachObj = req.body;

    let isPendingCoach = { success: false, coach: {} };

    isPendingCoach = await becomePendingCoach(coachObj, sPassword.hash);

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
    return { success: false, message: error };
  }
};

const saltHashPassword = async (password) => {
  try {
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return { success: true, hash: hash };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

router.post("/sign-up-user", async (req, res) => {
  try {
    const userIsValid = serverCheckUserIsValid(req.body);
    if (!userIsValid) {
      res
        .json({
          success: false,
          message: "Enter valid email & password.",
        })
        .status(403);
      return;
    }
    const email = req.body.email;
    const uniqueEmail = await checkUniqueEmail(email);
    if (!uniqueEmail.success) {
      res.json(uniqueEmail).status(409);
      return;
    }
    const password = req.body.password;
    const sPassword = await saltHashPassword(password);
    if (!sPassword.success) {
      return res
        .json({
          succes: false,
          message: "There was a problem, please try again.",
        })
        .status(503);
    }
    const hash = sPassword.hash;
    const userSaveSuccess = await createUser(email, hash);
    if (!userSaveSuccess) {
      res
        .json({ succes: false, message: "There was a problem, please" })
        .status(409);
    }
    return res.json({ success: userSaveSuccess }).status(200);
  } catch (error) {
    console.error(error);
    return res.json({ success: error }).status(500);
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
      res
        .json({
          success: false,
          message: "Enter valid email & password.",
        })
        .status(403);
      return;
    }
    const email = req.body.email;
    const password = req.body.password;
    const findUserObj = await findUserByKey("email", email);
    if (!findUserObj.success) {
      res
        .json({
          success: false,
          message: "We did not find that email.",
        })
        .status(406);
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

      res.json({ success: true, token: token }).status(200);
      return;
    }
    return res
      .json({
        success: false,
        message: "Wrong email or password.",
      })
      .status(406);
  } catch (error) {
    return res
      .json({
        success: false,
        message: "There was an error, please try again.",
      })
      .status(500);
  }
});

router.put("/forgot-password", async (req, res) => {
  try {
    const emailIsValid = serverCheckEmailIsValid(req.body);
    if (!emailIsValid) {
      res.json({ success: false, message: "Enter a valid email." }).status(403);
      return;
    }
    const email = req.body.email;
    const findUserObj = await findUserByKey("email", email);
    if (!findUserObj.success) {
      res
        .json({
          success: false,
          message: "We did not find that email, please try again.",
        })
        .status(406);
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
        `${urlEndpoint}/reset-password?rpt=${token}\n\n` +
        `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

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
  } catch (error) {
    console.log(error);
    return res.json({ success: error }).status(500);
  }
});

router.get("/validate-reset-password-token", async (req, res) => {
  try {
    const rpt = req.headers.rpt;
    const resetRequestee = await findUserByKey("resetPasswordToken", rpt);
    if (!resetRequestee.success) {
      console.log("we didnt find one");
      return res.json({ success: false }).status(406);
    }
    if (resetRequestee.success) {
      console.log("we found one!");
      console.log(resetRequestee.user);
      const user = resetRequestee.user;
      date = new Date();
      expDate = user.resetPasswordExpires;
      if (date.getTime() <= expDate.getTime()) {
        console.log("the current date is less than the exp date");
        return res.json({ success: true }).status(200);
      }
    }
    console.log("something didnt work right. or the token is exp");
    return res.json({ success: false }).status(401);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, messge: error });
  }
});

router.put("/reset-password", async (req, res) => {
  try {
    const password = req.body.password;
    const passCheck = serverCheckPasswordIsValid(req.body);
    if (!passCheck) {
      return res
        .json({ success: false, message: "Not a valid password" })
        .status(403);
    }
    const rpt = req.body.rpt;
    const sPassword = await saltHashPassword(password);
    if (!sPassword.success) {
      return res
        .json({
          succes: false,
          message: "There was a problem, please try again.",
        })
        .status(503);
    }
    const hash = sPassword.hash;
    const resetRequestee = await findUserByKey("resetPasswordToken", rpt);
    if (!resetRequestee.success) {
      res
        .json({
          success: false,
          message: "We did not find that user.",
        })
        .status(406);
      return;
    }
    console.log("did we make it here.");
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
    console.log("made it past the update");
    return res
      .json({ success: true, message: "password reset success" })
      .status(200);
  } catch (error) {
    res.json({ success: false, message: error }).status(500);
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
    const verified = jwt.verify(token, jwtSecretKey);
    if (!verified) {
      return res.json({ success: false, isAdmin: false }).status(401);
    }

    if (verified && verified.userType === "admin") {
      return res
        .json({
          success: true,
          isAdmin: true,
        })
        .status(200);
    } else {
      return res
        .json({
          success: true,
          isAdmin: false,
          verified: verified.data,
        })
        .status(403);
    }
  } catch (error) {
    // Access Denied
    return res.status(500).json({ success: false, message: error });
  }
});

router.get("/validate-coach", (req, res) => {
  try {
    const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
    const token = req.headers.token;
    const verified = jwt.verify(token, jwtSecretKey);

    if (!verified) {
      return res.json({ success: false, isCoach: false }).status(401);
    }

    if (verified && verified.userType === "coach") {
      return res
        .json({
          success: true,
          isCoach: true,
        })
        .status(200);
    } else {
      return res.json({ success: true, isCoach: false }).status(403);
    }
  } catch (error) {
    // Access Denied
    return res.status(500).json({ success: false, message: error });
  }
});

module.exports = router;
