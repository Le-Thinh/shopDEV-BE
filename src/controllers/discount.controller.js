"use strict";

const DiscountService = require("../services/discount.service");
const { SuccessResponse } = require("../core/success.response");

class DiscountController {
  createDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: "Create Discount Code Successfully",
      metadata: await DiscountService.createDiscountCode({
        ...req.body,
        shopId: req.user.userId,
      }),
    }).send(res);
  };

  updateDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: "Update Discount Code Successfully",
      metadata: await DiscountService.updateDiscountCode({
        payload: req.body,
        discountId: req.params.discountId,
      }),
    }).send(res);
  };

  getAllDiscountCodes = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfully code found",
      metadata: await DiscountService.getAllDiscountCodesByShop({
        ...req.query,
        shopId: req.user.userId,
      }),
    }).send(res);
  };

  getDiscountAmount = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfully code found",
      metadata: await DiscountService.getDiscountAmount({
        ...req.body,
      }),
    }).send(res);
  };

  getAllDiscountCodesWithProducts = async (req, res, next) => {
    new SuccessResponse({
      message: "Successfully code found",
      metadata: await DiscountService.getAllDiscountCodesWithProduct({
        ...req.query,
      }),
    }).send(res);
  };
}

module.exports = new DiscountController();
