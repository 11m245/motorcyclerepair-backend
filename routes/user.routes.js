import express from "express";
import {
  activateUserInDB,
  addUserInDB,
  checkUserAlreadyExist,
  getAllWorkshops,
  getUserActivationTokenFromObjectID,
  getUserFromActivationToken,
  getUserFromDBByEmail,
  getUserFromObjectID,
  getUserIdFromLoginToken,
  getUserIdFromResetToken,
  getUserProfileFromId,
  getWorkshopProfileFromId,
  getWorkshopsForPincode,
  makeLoginTokenExpire,
  makeResetTokenExpire,
  saveActivationTokenInDB,
  saveLoginToken,
  saveResetTokenInDB,
  updatePasswordInDB,
  updateUserDetails,
  updateWorkshopDetails,
} from "../services/user.services.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
const router = express.Router();

function checkValidSignupData(data) {
  const { role, name, mobile, email, password, cpassword } = data;
  const validStatus =
    (role === "user" || role === "workshop") &&
    name.length > 2 &&
    mobile.length === 10 &&
    email.length > 7 &&
    password.length > 7 &&
    password === cpassword;

  // console.log("isValid input", validStatus);
  return validStatus;
}

async function generateHashedPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  return hashedPassword;
}

async function generateActivationToken(userFromDB) {
  const token = jwt.sign(
    { userFromDB, date: Date.now() },
    process.env.SECRET_ACTIVATION_KEY
  );
  // console.log("generated token is", token);
  return token;
}

async function mailActivationLink(userActivationInfo, activationtoken) {
  // console.log("user activation info", userActivationInfo);
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail", //intead port use service gmail
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL, //  gmail user id
      pass: process.env.PASS, // generated gmail app password
    },
  });
  // send mail with defined transporter object
  const url = `${process.env.CLIENT_URL}/activate/${activationtoken}`;
  let info = await transporter.sendMail({
    from: '"MotorCycle Service App 👻" <sivaraj2siva@gmail.com>', // sender address
    to: `${userActivationInfo.email}`, // list of receivers
    subject: "Activation Link for MotorCycle Service App", // Subject line
    text: `sent by text,Hi ${userActivationInfo.name}, as you have requested to register, this is the link please click and activate your account. ${url}`, // plain text body
    html: `<div > <p>Hi <b>${userActivationInfo.name} </b> as you have requested to register, this is the link please click and activate your account.  ${url} </p> <b>click this link to activate</b> <a href=${url} target="_blank">Activate Account</a></div>`, // html body
  });
  console.log("Message sent: %s", info.messageId);
}

router.post("/signup", async function (request, response) {
  const data = request.body;
  // console.log(data);
  const isUserExist = await checkUserAlreadyExist(data);
  // console.log("isUserExist", isUserExist);
  if (isUserExist) {
    response.status(400).send({ message: "Already User Exist on this email" });
  } else {
    const isValidData = checkValidSignupData(data);
    if (isValidData) {
      if (data.role === "user") {
      }
      const { cpassword, pin, pins, ...dataWOCP } = data;
      // console.log("wocp", dataWOCP); //skipping confirm password
      let pinsArray = [];
      if (data.role === "workshop") {
        pinsArray = data.pins.split(",");
      }

      const formattedData =
        data.role === "user"
          ? {
              ...dataWOCP,
              pin: data.pin,
              isActivated: false,
              password: await generateHashedPassword(dataWOCP.password),
              createdAt: Date.now(),
            }
          : {
              ...dataWOCP,
              pins: pinsArray,
              rating: 0,
              isActivated: false,
              password: await generateHashedPassword(dataWOCP.password),
            };

      // console.log("formatted data", formattedData);
      const result = await addUserInDB(formattedData);
      // console.log("res", result);
      if (result.acknowledged) {
        // console.log("0 inserted id is", result.insertedId);
        const userFromDB = await getUserFromObjectID(result.insertedId);
        // console.log("1 userFromDB is", userFromDB);
        const activationToken = await generateActivationToken(userFromDB);
        // console.log("2 activationToken is", activationToken);
        const saveTokenResult = await saveActivationTokenInDB(
          userFromDB,
          activationToken
        );
        // console.log("3 saveToken result is", saveTokenResult);
        await mailActivationLink(userFromDB, activationToken);

        response.send({
          message:
            "User Created, use the Activation link Sent on mail for Activation",
        });
      } else {
        response.status(500).send({ message: "Unable to Create User" });
      }
    } else {
      response.status(400).send({ message: "Invalid Signup Data" });
    }
  }
});

router.post("/activate", async function (request, response) {
  const activationTokenFromFront = request.headers.activationtoken;
  const tokenedUserFromDB = await getUserFromActivationToken(
    activationTokenFromFront
  );
  // console.log("activationUserfromDB", tokenedUserFromDB);
  const tokenedUser = await getUserFromObjectID(tokenedUserFromDB.userId);
  if (tokenedUser) {
    if (!tokenedUser.isActivated) {
      await activateUserInDB(tokenedUser._id);
      response.send({
        message: "User Activation Success",
      });
    } else {
      response.status(401).send({
        message: "Already Activated user",
      });
    }
  } else {
    response.status(400).send({ message: "Unauthorised usage" });
  }
});

router.post("/login", async function (request, response) {
  const loginData = request.body;
  // console.log("loginData", loginData);
  const userFromDB = await getUserFromDBByEmail(loginData.email);
  if (userFromDB) {
    if (userFromDB.isActivated === true) {
      const isPasswordMatch = await bcrypt.compare(
        loginData.password,
        userFromDB.password
      );
      if (isPasswordMatch) {
        const loginToken = jwt.sign(
          { id: userFromDB._id, time: Date.now() },
          process.env.SECRET_KEY
        );
        await saveLoginToken(userFromDB, loginToken);
        response.status(200).send({
          message: "User Login Successfull",
          token: loginToken,
          role: userFromDB.role,
        });
      } else {
        response.status(401).send({ message: "Invalid Credentials" });
      }
    } else {
      const { token: activationToken } =
        await getUserActivationTokenFromObjectID(userFromDB._id);
      await mailActivationLink(userFromDB, activationToken).catch(
        console.error
      );
      response.status(300).send({
        message:
          "Inactive User, Kindly activate your account by verifying the link sent to mail ",
      });
    }
  } else {
    response.status(400).send({ message: "Invalid Credentials " });
  }
});

async function mailResetLink(userResetInfo) {
  // console.log("user reset info", userResetInfo);
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail", //intead port use service gmail
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL, //  gmail user id
      pass: process.env.PASS, // generated gmail app password
    },
  });
  // send mail with defined transporter object
  const url = `${process.env.CLIENT_URL}/change-password/${userResetInfo.resetToken}`;
  let info = await transporter.sendMail({
    from: '"MotorCycle Service App 👻" <sivaraj2siva@gmail.com>', // sender address
    to: `${userResetInfo.email}`, // list of receivers
    subject: "Password Reset for MotorCycle Service App", // Subject line
    text: `Hi ${userResetInfo.name}, as you have requested to reset Password, this is the link please click and reset. ${url}`, // plain text body
    html: `<div > <p>Hi ${userResetInfo.name} as you have requested to reset Password, this is the link please click and reset.  ${url} </p> <b>forgot? click this link to reset</b> <a href=${url} target="_blank">Reset Password</a></div>`, // html body
  });
  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}

async function generateResetToken(userFromDB) {
  const token = jwt.sign(
    { userFromDB, date: Date.now() },
    process.env.SECRET_ACTIVATION_KEY
  );
  // console.log("generated reset token is", token);
  return token;
}

router.post("/sendResetLink", async function (request, response) {
  const data = request.body;
  // console.log(data);
  const userFromDB = await getUserFromDBByEmail(data.email);
  if (userFromDB) {
    const resetToken = await generateResetToken(userFromDB);

    await saveResetTokenInDB(userFromDB, resetToken);

    const userResetInfo = { ...userFromDB, resetToken: resetToken };
    await mailResetLink(userResetInfo).catch(console.error);
    response.status(200).send({
      message: "Click on Reset Password link has been sent to your email",
    });
  } else {
    response
      .status(400)
      .send({ message: "Invalid Credentials. try registration first" });
  }
});

router.get("/getInfoFromResetToken", async function (request, response) {
  const { resettoken } = request.headers;
  // console.log("reset token is", resettoken);
  const tokenedUser = await getUserIdFromResetToken(resettoken);
  if (tokenedUser) {
    const user = await getUserFromObjectID(tokenedUser.userId);
    // console.log("user is", user);
    response.send({
      message: "user details fetched",
      payload: { name: user.name, email: user.email },
    });
  } else {
    response.status(400).send({ message: "Unauthorised Usage" });
  }
});

router.post("/change-password", async function (request, response) {
  const { resettoken } = request.headers;
  const data = request.body;
  // console.log(data);
  const tokenedUser = await getUserIdFromResetToken(resettoken);
  const userFromDB = await getUserFromObjectID(tokenedUser.userId);
  // console.log("usersssss", userFromDB);
  if (data.email === userFromDB.email) {
    if (data.password === data.cpassword) {
      const newPassword = await generateHashedPassword(data.password);
      const result = await updatePasswordInDB(data.email, newPassword);
      await makeResetTokenExpire(resettoken);
      // console.log("password change result", result);
      if (result.modifiedCount === 1) {
        response.send({ message: "Password Change Success" });
      } else {
        response.status(500).send({ message: "Unable to Update Password" });
      }
    } else {
      response.status(300).send({ message: "Passwords not matched" });
    }
  } else {
    response.status(400).send({ message: "unauthorised Usage" });
  }
});

router.get("/getUserNameImage", async function (request, response) {
  const { logintoken } = request.headers;
  // console.log("reset token is", resettoken);
  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  if (tokenedUser) {
    const user = await getUserFromObjectID(tokenedUser.userId);
    // console.log("user is", user);
    response.send({
      message: "user details fetched",
      payload: { name: user.name, role: user.role },
    });
  } else {
    response.status(400).send({ message: "Unauthorised Usage" });
  }
});

router.post("/makeLoginTokenExpire", async function (request, response) {
  const { logintoken } = request.headers;

  const result = await makeLoginTokenExpire(logintoken);
  result.modifiedCount > 0
    ? response.send({ message: "token expired" })
    : response.status(500).send({ message: "error token not expired" });
});

// router.get("/pin", async function (request, response) {
//   const { logintoken } = request.headers;
//   const tokenedUser = await getUserIdFromLoginToken(logintoken);
//   if (tokenedUser) {
//     const user = await getUserFromObjectID(tokenedUser.userId);
//     // console.log("user is", user);
//     response.send({
//       message: "user pin fetched",
//       payload: user.pin,
//     });
//   } else {
//     response.status(400).send({ message: "Unauthorised Usage" });
//   }
// });

router.get("/pinWorkshop", async function (request, response) {
  const { logintoken, pin } = request.headers;
  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  if (tokenedUser) {
    const user = await getUserFromObjectID(tokenedUser.userId);
    // console.log("user is", user);
    const workshops = user.pin
      ? await getWorkshopsForPincode(user.pin)
      : await getAllWorkshops();
    // console.log("workshops", workshops);
    response.send({
      message: "user pin workshops fetched",
      payload: workshops,
    });
  } else {
    response.status(400).send({ message: "Unauthorised Usage" });
  }
});

router.get("/profile", async function (request, response) {
  const { logintoken } = request.headers;
  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  if (tokenedUser) {
    const user = await getUserFromObjectID(tokenedUser.userId);
    // console.log("profile login user is", user);
    const profile =
      user.role === "user"
        ? await getUserProfileFromId(user._id)
        : await getWorkshopProfileFromId(user._id);
    // console.log("profile", profile);
    response.send({
      message: "user profile fetched",
      payload: profile,
    });
  } else {
    response.status(400).send({ message: "Unauthorised Usage" });
  }
});

router.put("/updateUserProfile", async function (request, response) {
  const { logintoken } = request.headers;
  const data = request.body;
  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  if (tokenedUser) {
    const user = await getUserFromObjectID(tokenedUser.userId);
    if (user.email === data.email) {
      // console.log("profile login user is", user);
      if (data.password === data.cpassword) {
        const hashedPassword = await generateHashedPassword(data.password);
        const { password, cpassword, ...dataWOP } = data;
        const res = await updateUserDetails(user._id, {
          ...dataWOP,
          password: hashedPassword,
        });
        // console.log("update profile res is", res);
        if (res.modifiedCount > 0) {
          response.send({
            message: "User Updated, use the New credentials for login",
          });
        } else {
          response.status(500).send({ message: "Can't update User Details" });
        }
      } else {
        response.status(400).send({ message: "Passwords not matched" });
      }
    } else {
      response.status(400).send({ message: "Wrong User" });
    }
  } else {
    response.status(400).send({ message: "Unauthorised Usage" });
  }
});

router.put("/updateWorkshopProfile", async function (request, response) {
  const { logintoken } = request.headers;
  const data = request.body;
  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  if (tokenedUser) {
    const user = await getUserFromObjectID(tokenedUser.userId);
    if (user.email === data.email) {
      // console.log("profile login user is", user);
      if (data.password === data.cpassword) {
        const hashedPassword = await generateHashedPassword(data.password);
        const { password, cpassword, ...dataWOP } = data;
        let pinsArray = [];
        if (data.role === "workshop") {
          pinsArray = dataWOP.pins.split(",");
        }

        const res = await updateWorkshopDetails(user._id, {
          ...dataWOP,
          pins: pinsArray,
          password: hashedPassword,
        });
        // console.log("update workshop profile res is", res);
        if (res.modifiedCount > 0) {
          response.send({
            message: "Workshop Updated, use the New credentials for login",
          });
        } else {
          response
            .status(500)
            .send({ message: "Can't update Workshop Details" });
        }
      } else {
        response.status(400).send({ message: "Passwords not matched" });
      }
    } else {
      response.status(400).send({ message: "Wrong Workshop User" });
    }
  } else {
    response.status(400).send({ message: "Unauthorised Usage" });
  }
});

export default router;
