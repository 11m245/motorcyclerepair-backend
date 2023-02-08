import { client } from "../index.js";

export async function addNewService(data) {
  return await client
    .db("motorCycleRepairApp")
    .collection("services")
    .insertOne(data);
}

export async function getServiceByName(serviceName) {
  return await client
    .db("motorCycleRepairApp")
    .collection("services")
    .findOne({ name: serviceName });
}

export async function getAllServices() {
  return await client
    .db("motorCycleRepairApp")
    .collection("services")
    .find({})
    .toArray();
}
