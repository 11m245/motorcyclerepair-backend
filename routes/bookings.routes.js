import express from "express";
import { ObjectId } from "mongodb";
import {
  addBooking,
  getAllBookingsFromId,
} from "../services/bookings.services.js";
import {
  getUserFromObjectID,
  getUserIdFromLoginToken,
  getWorkshopFromObjectID,
} from "../services/user.services.js";
const router = express.Router();

router.post("/new", async function (request, response) {
  const data = request.body;
  const { logintoken } = request.headers;

  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  if (tokenedUser) {
    const user = await getUserFromObjectID(tokenedUser.userId);
    const workshop = await getWorkshopFromObjectID(
      new ObjectId(data.workshopId)
    );
    // console.log("booked workshop ", workshop);
    const formattedData = {
      ...data,
      workshopId: workshop._id,
      bookedBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false,
      statusCode: "00",
      statusHistory: [
        { statusCode: "00", updatedBy: user._id, updatedAt: Date.now() },
      ],
    };
    const result = await addBooking(formattedData);
    console.log("add book res", result);
    if (result.acknowledged) {
      response.send({ message: "booked succesfully" });
    } else {
      response.status(500).send({ message: "unable to book" });
    }
  } else {
    response.status(400).send({ message: "unauthorised Usage" });
  }
});

router.get("/getAllUserBookings", async function (request, response) {
  const data = request.body;
  const { logintoken } = request.headers;
  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  const res = await getAllBookingsFromId(tokenedUser.userId);
  if (res.length > 0) {
    response.send({ message: "user bookings fetched", payload: res });
  } else {
    response.status(500).send({ message: "no bookings" });
  }
});
export default router;
