import express from "express";
import { ObjectId } from "mongodb";
import {
  addBooking,
  getAllBookingsFromId,
  getAllWorkshopBookingsFromId,
  getBookingById,
  updateNewBookingStatus,
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
    // console.log("add book res", result);
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
  if (!tokenedUser) {
    response.status(400).send("Unauthorised Usage");
  }
  const res = await getAllBookingsFromId(tokenedUser.userId);
  if (res.length > 0) {
    response.send({ message: "user bookings fetched", payload: res });
  } else {
    response.status(500).send({ message: "no bookings" });
  }
});

router.get("/workshopBookings", async function (request, response) {
  const { logintoken } = request.headers;
  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  if (!tokenedUser) {
    response.status(400).send({ message: "Unauthorised Usage" });
  }
  // console.log("workshop bookings tokened user", tokenedUser);
  const res = await getAllWorkshopBookingsFromId(tokenedUser.userId);
  // console.log("workshop booings res", res);
  if (res.length > 0) {
    response.send({ message: "workshop bookings fetched", payload: res });
  } else {
    response.status(500).send({ message: "no workshop bookings" });
  }
});
router.put("/updateStatus/:newStatusCode", async function (request, response) {
  const { logintoken } = request.headers;
  const { newStatusCode } = request.params;
  const { bookingId } = request.body;
  // console.log("body booking id", bookingId, newStatusCode);
  const tokenedUser = await getUserIdFromLoginToken(logintoken);
  if (!tokenedUser) {
    response.status(400).send("Unauthorised Usage");
  }
  const booking = await getBookingById(new ObjectId(bookingId));
  if (booking) {
    // console.log("booking exist");
    const newStatus = {
      statusCode: newStatusCode,
      updatedBy: tokenedUser.userId,
      updatedAt: Date.now(),
    };
    const updateResult = await updateNewBookingStatus(
      newStatus,
      new ObjectId(bookingId)
    );
    // console.log("status update result is", updateResult);
    if (updateResult.modifiedCount > 0) {
      response.send({ message: "New Status Updated Successfully" });
    } else {
      response.status(500).send({ message: "Unable to update the status" });
    }
  } else {
    response.status(400).send({ message: "Unauthorised Usage" });
  }
});
export default router;
