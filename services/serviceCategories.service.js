import { client } from "../index.js";
export async function getAllServiceCategories() {
  return await client
    .db("motorCycleRepairApp")
    .collection("servicecategories")
    .find({})
    .toArray();
}

export async function AddServiceCategory(data) {
  return await client
    .db("motorCycleRepairApp")
    .collection("servicecategories")
    .insertOne(data);
}

export async function getServiceCategoryByName(categoryName) {
  return await client
    .db("motorCycleRepairApp")
    .collection("servicecategories")
    .findOne({ name: categoryName });
}
