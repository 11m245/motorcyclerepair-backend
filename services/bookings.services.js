import { client } from "../index.js";
export async function addBooking(data) {
  return await client
    .db("motorCycleRepairApp")
    .collection("bookings")
    .insertOne(data);
}

export async function getAllBookingsFromId(id) {
  return await client
    .db("motorCycleRepairApp")
    .collection("bookings")
    .aggregate([
      {
        $match: {
          bookedBy: id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "workshopId",
          foreignField: "_id",
          as: "workshop",
        },
      },
      { $unwind: "$workshop" },
      {
        $project: {
          "workshop.password": 0,
          "workshop.isActivated": 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();
}

export async function getAllWorkshopBookingsFromId(id) {
  return await client
    .db("motorCycleRepairApp")
    .collection("bookings")
    .aggregate([
      {
        $match: {
          workshopId: id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "bookedBy",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          "user.password": 0,
          "user.isActivated": 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();
}

export async function getBookingById(id) {
  return await client
    .db("motorCycleRepairApp")
    .collection("bookings")
    .findOne({ _id: id });
}

export async function updateNewBookingStatus(newStatus, bookingId) {
  if (newStatus.statusCode === "05") {
    // console.log("if runs 05", newStatus, bookingId);
    await client
      .db("motorCycleRepairApp")
      .collection("bookings")
      .updateOne({ _id: bookingId }, { $set: { isCompleted: true } });
  }
  await client
    .db("motorCycleRepairApp")
    .collection("bookings")
    .updateOne(
      { _id: bookingId },
      { $set: { statusCode: newStatus.statusCode, updatedAt: Date.now() } }
    );
  return await client
    .db("motorCycleRepairApp")
    .collection("bookings")
    .updateOne({ _id: bookingId }, { $push: { statusHistory: newStatus } });
}
