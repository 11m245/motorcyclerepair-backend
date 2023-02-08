import express from "express";
import { getServiceCategoryByName } from "../services/serviceCategories.service.js";
import {
  addNewService,
  getAllServices,
  getServiceByName,
} from "../services/services.services.js";
const router = express.Router();

router.post("/new", async function (request, response) {
  const data = request.body;
  const isCategoryExist = await getServiceCategoryByName(data.category);
  if (isCategoryExist) {
    const isServiceExist = await getServiceByName(data.name);
    if (isServiceExist) {
      response.status(302).send({ message: "Service Already  Exist" });
    } else {
      const result = await addNewService(data);
      //   console.log("add service result is", result);
      if (result.acknowledged) {
        response.send({ message: "New Service Added" });
      } else {
        response.status(500).send({ message: "can't add new service " });
      }
    }
  } else {
    response.status(400).send({ message: "Category Not Exist" });
  }
});

router.get("/all", async function (request, response) {
  const result = await getAllServices();
  if (result.length > 0) {
    response.send({ message: "All Services Fetched", payload: result });
  } else {
    response.status(500).send({ message: "No Services Found" });
  }
});
export default router;
