"use strict";

const express = require("express");
const CartController = require("../../controllers/cart.controller");
const { asyncHandler } = require("../../auth/checkAuth");
const { authenticationV2 } = require("../../auth/authUtils");
const router = express.Router();

router.post("", asyncHandler(CartController.addToCart));
router.delete("/delete", asyncHandler(CartController.delete));
router.post("/update", asyncHandler(CartController.update));
router.get("", asyncHandler(CartController.listToCart));

module.exports = router;
