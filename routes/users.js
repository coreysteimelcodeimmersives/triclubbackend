var express = require("express");
var router = express.Router();
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
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

    res.status(200).json({
      success: true,
      message:
        "Coach successfully accepted and assigned 'Coach' access priveledges",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: String(error) });
  }
});

router.put("/purchase-program", async (req, res) => {
  try {
    //VERIFY ALL THE USER INPUT
    const userInfo = req.body.userInfo;
    const programId = req.body.programId;
    const token = req.headers.token;
    const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
    if (!token) {
      return res
        .status(500)
        .json({ success: false, message: "no jwt token exists" });
    }
    const verified = jwt.verify(token, jwtSecretKey);
    const userObj = await findUserByKey("uid", verified.userId);
    if (!userObj.success) {
      res.status(406).json({
        success: false,
        message: "We did not find your account.",
      });
      return;
    }
    const user = userObj.user;
    let userChildrenArr = [];
    const child = userInfo.child;
    if (user.children) {
      userChildrenArr = [...user.children];
      if (
        !userChildrenArr.some(
          (someChild) => someChild.firstNameChild === child.firstNameChild
        )
      ) {
        userChildrenArr = [...userChildrenArr, child];
      }
    } else {
      userChildrenArr = [...userChildrenArr, child];
    }

    let userPrograms = {};
    if (user.progams) {
      userPrograms = JSON.parse(JSON.stringify(user.progams));
    }

    console.log("user info", userPrograms);
    const newPrograms = {
      ...userPrograms,
      [programId]: userInfo.child.firstNameChild,
    };
    console.log("new user programs ", newPrograms);
    const collection = await triclubDb().collection("users");
    await collection.updateOne(
      { uid: verified.userId },
      {
        $set: {
          ...user,
          userInfo: {
            addressOne: userInfo.addressOne,
            addressTwo: userInfo.addressTwo,
            city: userInfo.city,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            stateAbb: userInfo.stateAbb,
            telephone: userInfo.telephone,
            zipCode: userInfo.zipCode,
          },
          children: userChildrenArr,
          progams: {
            ...newPrograms,
          },
        },
      }
    );
    return res.status(200).json({
      success: true,
      message: "User purchased program",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: String(error) });
  }
});

router.get("/get-user-info", async (req, res) => {
  try {
    const token = req.headers.token;
    const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
    if (!token) {
      return res
        .status(500)
        .json({ success: false, message: "no jwt token exists" });
    }
    const verified = jwt.verify(token, jwtSecretKey);
    const userObj = await findUserByKey("uid", verified.userId);
    if (!userObj.success) {
      res.status(406).json({
        success: false,
        message: "We did not find your account.",
      });
      return;
    }
    const user = userObj.user;
    const userInfo = user.userInfo;
    return res.status(200).json({
      success: true,
      message: "you should have the user info",
      obj: userInfo,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: String(error) });
  }
});

router.get("/get-user-children", async (req, res) => {
  try {
    const token = req.headers.token;
    const jwtSecretKey = process.env.REACT_APP_JWT_SECRET_KEY;
    if (!token) {
      return res
        .status(500)
        .json({ success: false, message: "no jwt token exists" });
    }
    const verified = jwt.verify(token, jwtSecretKey);
    const userObj = await findUserByKey("uid", verified.userId);
    if (!userObj.success) {
      res.status(406).json({
        success: false,
        message: "We did not find your account.",
      });
      return;
    }
    const user = userObj.user;
    const children = user.children;
    return res.status(200).json({
      success: true,
      message: "you should have the children array",
      obj: children,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: String(error) });
  }
});

(module.exports = router), findUserByKey;
