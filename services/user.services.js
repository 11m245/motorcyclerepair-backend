import { client } from "../index.js";

export async function checkUserAlreadyExist(data) {
  const { email } = data;
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .findOne({ email: email });
}

export async function addUserInDB(data) {
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .insertOne(data);
}

export async function getUserFromObjectID(id) {
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .findOne({ _id: id });
}

export async function getWorkshopFromObjectID(id) {
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .findOne({ role: "workshop", _id: id });
}

export async function saveActivationTokenInDB(userFromDB, token) {
  const formattedData = {
    userId: userFromDB._id,
    type: "activation",
    createdAt: Date.now(),
    token: token,
    isExpired: false,
  };
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .insertOne(formattedData);
}

export async function getUserFromActivationToken(token) {
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .findOne({ $and: [{ type: "activation" }, { token: token }] });
}

export async function activateUserInDB(id) {
  await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .updateOne(
      { $and: [{ type: "activation" }, { userId: id }] },
      { $set: { isExpired: true } }
    );
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .updateOne({ _id: id }, { $set: { isActivated: true } });
}

export async function getUserFromDBByEmail(email) {
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .findOne({ email: email });
}

export async function getUserActivationTokenFromObjectID(objId) {
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .findOne({ $and: [{ userId: objId }, { type: "activation" }] });
}

export async function saveLoginToken(userFromDB, token) {
  const formattedData = {
    userId: userFromDB._id,
    type: "login",
    createdAt: Date.now(),
    token: token,
    isExpired: false,
  };
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .insertOne(formattedData);
}

export async function saveResetTokenInDB(userFromDB, token) {
  const formattedData = {
    userId: userFromDB._id,
    type: "reset",
    createdAt: Date.now(),
    token: token,
    isExpired: false,
  };
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .insertOne(formattedData);
}

export async function getUserIdFromResetToken(resetToken) {
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .findOne({
      $and: [{ type: "reset" }, { token: resetToken }, { isExpired: false }],
    });
}

export async function updatePasswordInDB(email, newPassword) {
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .updateOne({ email: email }, { $set: { password: newPassword } });
}

export async function makeResetTokenExpire(resetToken) {
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .updateOne(
      { $and: [{ type: "reset" }, { token: resetToken }] },
      { $set: { isExpired: true } }
    );
}

export async function getUserIdFromLoginToken(logintoken) {
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .findOne({
      $and: [{ type: "login" }, { token: logintoken }, { isExpired: false }],
    });
}

export async function makeLoginTokenExpire(logintoken) {
  return await client
    .db("motorCycleRepairApp")
    .collection("userTokens")
    .updateOne(
      { $and: [{ type: "login" }, { token: logintoken }] },
      { $set: { isExpired: true } }
    );
}

export async function getWorkshopsForPincode(pincode) {
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .find(
      { $and: [{ role: "workshop" }, { pins: pincode }] },
      { projection: { password: 0, isActivated: 0 } }
    )
    .toArray();
}

export async function getAllWorkshops() {
  return await client
    .db("motorCycleRepairApp")
    .collection("users")
    .find({ role: "workshop" }, { projection: { password: 0, isActivated: 0 } })
    .toArray();
}
