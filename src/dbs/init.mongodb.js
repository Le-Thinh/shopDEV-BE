"use strict";

const mongoose = require("mongoose");
const {
  db: { host, name, port },
} = require("../configs/config.mongodb");

const connectString = `mongodb://${host}:${port}/${name}`;
console.log("ConnectString::::", connectString);
const { countConnect } = require("../helpers/check.connect.js");

//Singleton Pattern
class Database {
  constructor() {
    this.connect();
  }

  connect(type = "mongodb") {
    if (1 === 1) {
      mongoose.set("debug", true);
      mongoose.set("debug", {
        color: true,
      });
    }

    mongoose
      .connect(connectString, {
        maxPoolSize: 50,
      })
      .then((_) => {
        console.log(`Connected MongoDB Success PRO`, countConnect());
      })
      .catch((err) => console.log("Error connect!"));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();

module.exports = instanceMongodb;
