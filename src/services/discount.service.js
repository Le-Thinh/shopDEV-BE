"use strict";

const { BadRequestError, NotFoundError } = require("../core/error.response");
const discountModel = require("../models/discount.model");
const {
  checkDiscountExists,
  findAllDiscountCodesSelect,
  findAllDiscountCodesUnSelect,
  updateDiscountById,
} = require("../models/repositories/discount.repo");
const { findAllProducts } = require("../models/repositories/product.repo");
const {
  convertToObjectIdMongodb,
  updateNestedObject,
  removeUndefinedObject,
} = require("../utils");

/**
 * Discount Services
 * 1 - Generator Discount Code [Shop | Administration]
 * 2 - Get discount amount [User]
 * 3 - Get all discount codes [Users | Shop]
 * 4 - Verify discount code [Users]
 * 5 - Delete discount code [Shop | Administration]
 * 6 - Cancel discount code [Users]
 */

class DiscountService {
  static async createDiscountCode(payload) {
    const {
      code,
      start_date,
      end_date,
      is_active,
      shopId,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      max_uses,
      uses_count,
      max_uses_per_user,
      users_used,
    } = payload;

    // if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
    //   throw new BadRequestError("Discount code has expired!");
    // }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError("Start date must be before end date!");
    }

    // Create index for discount code
    const foundDiscount = await checkDiscountExists({
      model: discountModel,
      filter: {
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });

    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount code already exists!");
    }

    const newDiscount = await discountModel.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_code: code,
      discount_value: value,
      discount_min_order_value: min_order_value || 0,
      discount_max_value: max_value,
      discount_start_date: new Date(start_date),
      discount_end_date: new Date(end_date),
      discount_max_uses: max_uses,
      discount_uses_count: uses_count,
      discount_users_used: users_used,
      discount_shopId: shopId,
      discount_max_uses_per_user: max_uses_per_user,
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === "all" ? [] : product_ids,
    });

    return newDiscount;
  }

  //   Update discount code
  static async updateDiscountCode({ discountId, payload }) {
    return await updateDiscountById({
      discountId: convertToObjectIdMongodb(discountId),
      payload: removeUndefinedObject(payload),
      model: discountModel,
    });
  }

  /**
   * Get all discount codes available with product
   */

  static async getAllDiscountCodesWithProduct({
    code,
    shopId,
    userId,
    limit,
    page,
  }) {
    //   create index for discount_code
    const foundDiscount = await checkDiscountExists({
      model: discountModel,
      filter: {
        discount_code: code,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });
    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount code not exists!");
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount;
    let products;
    if (discount_applies_to === "all") {
      //get all product
      products = await findAllProducts({
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }
    if (discount_applies_to === "specific") {
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
      // get the products ids
    }
    return products;
  }

  /**
   * Get all discount code of Shop
   */

  static async getAllDiscountCodesByShop({ limit, page, shopId }) {
    const discounts = await findAllDiscountCodesUnSelect({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: convertToObjectIdMongodb(shopId),
        discount_is_active: true,
      },
      unSelect: ["__v", "discount_shopId"],
      model: discountModel,
    });

    return discounts;
  }

  /*
  Apply Discount Code
    products = [
      {
        productId,
        ShopId,
        quantity,
        name,
        price
      },
      {
        productId,
        ShopId,
        quantity,
        name,
        price
      },
    ]
  */

  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscountExists({
      model: discountModel,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });
    if (!foundDiscount) throw new NotFoundError("Discount does not exists");
    const {
      discount_is_active,
      discount_max_uses,
      discount_min_order_value,
      discount_start_date,
      discount_end_date,
      discount_max_uses_per_user,
      discount_users_used,
      discount_type,
      discount_value,
    } = foundDiscount;

    if (!discount_is_active) throw new NotFoundError("Discount expired!");
    if (!discount_max_uses) throw new NotFoundError("Discount are out");

    // if (
    //   new Date() < new Date(discount_start_date) ||
    //   new Date() > new Date(discount_end_date)
    // )
    //   throw new NotFoundError("Discount code has expired!");

    // Check xem có giá trị tối thiểu hay không
    let totalOrder = 0;
    if (discount_min_order_value > 0) {
      //get total
      totalOrder = products.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);
    }

    if (totalOrder < discount_min_order_value)
      throw new NotFoundError(
        `discount requires a minimum order value of ${discount_min_order_value}!`
      );

    if (discount_max_uses_per_user > 0) {
      const userUseDiscount = discount_users_used.find(
        (user) => user.userId === userId
      );

      if (userUseDiscount) {
        throw new NotFoundError("discount used!!");
      }
    }

    const amount =
      discount_type === "fixed_amount"
        ? discount_value
        : totalOrder * (discount_value / 100);

    return {
      totalOrder,
      discount: amount,
      totalPrice: totalOrder - amount,
    };
  }

  /*
  Delete discount nên chuyển sang một db khác thay vì xóa nó
  database. Tại vì nếu như lúc cần (vd: kiện..) thì có thể lôi ra.
  */

  // Cách này làm nhanh
  // Xóa discount phức tạp hơn những gì cta nghĩ
  static async deleteDiscountCode({ shopId, codeId }) {
    const deleted = await discountModel.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectIdMongodb(shopId),
    });

    return deleted;
  }

  /**
   Cancel Discount Code ()
   */

  static async cancelDiscountCode({ codeId, shopId, userId }) {
    const foundDiscount = await checkDiscountExists({
      model: discountModel,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectIdMongodb(shopId),
      },
    });
    if (!foundDiscount) throw new NotFoundError("Discount does not exists");

    const result = await discountModel.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId,
      },

      $inc: {
        discount_max_uses: 1,
        discount_uses_count: -1,
      },
    });

    return result;
  }
}

module.exports = DiscountService;
