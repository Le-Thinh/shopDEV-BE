"use strict";

const express = require("express");
const apikeyController = require("../../controllers/apiKey.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const router = express.Router();

//
router.post("", asyncHandler(apikeyController.createAPIKey));

module.exports = router;
