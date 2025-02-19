require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const app = express();
const { default: helmet } = require("helmet");
const compression = require("compression");

//init middlewares
app.use(morgan("dev")); //Dev
// app.use(morgan("combined")); //Product
app.use(helmet());
app.use(compression());

//init db
require("./dbs/init.mongodb");
const { checkOverload } = require("./helpers/check.connect.js");
// checkOverload();

//init routes
app.get("/", (req, res, next) => {
  const strCompress = "Hello Factipjs";

  return res.status(200).json({
    message: "Welcome to my team",
    metadata: strCompress.repeat(10),
  });
});

//handling error

module.exports = app;
