"use strict";
const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const CartService = require("../services/cart.service");

class CartController {
  addToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "Create new cart successfully",
      metadata: await CartService.addToCart(req.body),
    }).send(res);
  };

  update = async (req, res, next) => {
    new SuccessResponse({
      message: "Update cart successfully",
      metadata: await CartService.addToCartV2(req.body),
    }).send(res);
  };

  delete = async (req, res, next) => {
    new SuccessResponse({
      message: "Create new cart successfully",
      metadata: await CartService.deleteUserCart(req.body),
    }).send(res);
  };

  listToCart = async (req, res, next) => {
    new SuccessResponse({
      message: "List Cart successfully",
      metadata: await CartService.getListCart(req.query),
    }).send(res);
  };
}

module.exports = new CartController();
