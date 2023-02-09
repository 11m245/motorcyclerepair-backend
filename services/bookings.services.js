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
