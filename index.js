import express from "express";
import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import servicesRouter from "./routes/services.routes.js";
import serviceCategoriesRouter from "./routes/serviceCategories.routes.js";

const app = express(); //invoke the express and get the app object
const PORT = process.env.PORT;

const MONGO_URL = process.env.MONGO_URL;
export const client = new MongoClient(MONGO_URL); //use MongoClient URL
client.connect();
console.log("mongo connected");

app.listen(PORT, () => console.log("app started in port", PORT));
app.use(express.json());
app.use(cors());

app.get("/", function (request, response) {
  response.send("Welcome to Motor Cycle Repair API");
});

app.use("/user", userRouter);
app.use("/services", servicesRouter);
app.use("/serviceCategories", serviceCategoriesRouter);
