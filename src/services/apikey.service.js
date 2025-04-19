"use strict";

const apiKeyModel = require("../models/apikey.model");
const crypto = require("crypto");

const createAPIKey = async () => {
  const newKey = await apiKeyModel.create({
    key: crypto.randomBytes(64).toString("hex"),
    permissions: ["0000"],
  });
  console.log(newKey);
  return newKey;
};

const findByID = async (key) => {
  // const newKey = await apiKeyModel.create({
  //   key: crypto.randomBytes(64).toString("hex"),
  //   permissions: ["0000"],
  // });
  // console.log(newKey);

  const objKey = await apiKeyModel.findOne({ key, status: true }).lean();

  return objKey;
};

module.exports = {
  findByID,
  createAPIKey,
};
