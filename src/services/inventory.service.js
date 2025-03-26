"use strict";
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");

const { getProductById } = require("../models/repositories/product.repo");
const { inventory } = require("../models/inventory.model");

class InventoryService {
  static async addStockToInventory({
    stock,
    productId,
    shopId,
    location = "Go Vap, HCM City",
  }) {
    const product = await getProductById(productId);
    if (!product) throw new BadRequestError("The product does not exist");

    const query = { inven_shopId: shopId, inven_productId: productId };

    const updateSet = {
        $inc: {
          inven_stock: stock,
        },
        $set: {
          inven_location: location,
        },
      },
      options = { upsert: true, new: true };

    return await inventory.findOneAndUpdate(query, updateSet, options);
  }
}

module.exports = InventoryService;
