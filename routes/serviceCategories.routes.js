import express from "express";
import {
  AddServiceCategory,
  getAllServiceCategories,
  getServiceCategoryByName,
} from "../services/serviceCategories.service.js";
const router = express.Router();

router.get("/all", async function (request, response) {
  const result = await getAllServiceCategories();
  if (result.length > 0) {
    response.send({ message: "All Categories Fetched", payload: result });
  } else {
    response.status(500).send({ message: "No Categories Found" });
  }
});

router.post("/new", async function (request, response) {
  const data = request.body;
  const isAlreadyExist = await getServiceCategoryByName(data.name);
  if (isAlreadyExist) {
    response.status(302).send({ message: "category Already Exist" });
  } else {
    const result = await AddServiceCategory(data);
    // console.log("add service category result is", result);
    if (result.acknowledged) {
      response.send({ message: "New Service Category Added" });
    } else {
      response.status(500).send({ message: "cannot add service Category" });
    }
  }
});

export default router;
