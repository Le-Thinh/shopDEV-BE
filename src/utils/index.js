"use strict";

const _ = require("lodash");
const { Types } = require("mongoose");

const convertToObjectIdMongodb = (id) => new Types.ObjectId(id);

const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

// ['a','b'] => {a: 1, b: 1}
const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]));
};

// ['a','b'] => {a: 0, b: 0}
const unGetSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 0]));
};

const removeUndefinedObject = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null) {
      delete obj[key];
    }
  });

  return obj;
};

const updateNestedObject = (obj) => {
  const final = {};

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      const response = updateNestedObject(obj[key]);
      Object.keys(response).forEach((k) => {
        final[`${key}.${k}`] = response[k];
      });
    } else {
      final[key] = obj[key];
    }
  });

  return final;
};

module.exports = {
  getInfoData,
  getSelectData,
  unGetSelectData,
  removeUndefinedObject,
  updateNestedObject,
  convertToObjectIdMongodb,
};
