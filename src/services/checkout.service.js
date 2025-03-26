"use strict";

const { findCartById } = require("../models/repositories/cart.repo");
const { BadRequestError, NotFoundError } = require("../core/error.response");
const { checkProductByServer } = require("../models/repositories/product.repo");
const { getDiscountAmount } = require("./discount.service");
const { acquireLock, releaseLock } = require("./redis.service");
const { order } = require("../models/order.model");
class CheckoutService {
  /*
    payload
    {
      cartId: ,
      userId: ,
      shop_order_ids: [
        {
            shopId,
            shop_discounts: [
                {
                    shopId,
                    discountId,
                    codeId
                }
            ],
            item_products: [
               {  
                    price,
                    quantity,
                    productId
                },
                {  
                    price,
                    quantity,
                    productId
                },
            ]
        },
        {
            shopId,
            shop_discounts: [],
            item_products: [
               {  
                    price,
                    quantity,
                    productId
                },
                {  
                    price,
                    quantity,
                    productId
                },
            ]
        }
      ]
    */

  static async checkoutReview({ cartId, userId, shop_order_ids }) {
    // check cart id ton tai?
    const foundCart = await findCartById(cartId);

    if (!foundCart) throw new BadRequestError("Cart does not exist!");
    const checkout_order = {
        totalPrice: 0, //Tong tien hang
        feeShip: 0, //Phi van chuyen
        totalDiscount: 0, // Tong tien giam gia
        totalCheckout: 0, // Tong thanh toan
      },
      shop_order_ids_new = [];

    //   tinh tong tien bill
    for (let i = 0; i < shop_order_ids.length; i++) {
      const {
        shopId,
        shop_discounts = [],
        item_products = [],
      } = shop_order_ids[i];

      //check product available
      const checkProductServer = await checkProductByServer(item_products);
      if (!checkProductServer[0]) throw new BadRequestError("order wrong!!!");

      //tong tien don hang
      const checkoutPrice = checkProductServer.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);

      //Truong hop: 2 sản phẩm cùng 1 shop, nhưng 1 sản phẩm có discount, 1 sản phẩm thì không

      // tong tien truoc khi xu li
      checkout_order.totalPrice += checkoutPrice;

      const itemCheckout = {
        shopId,
        shop_discounts,
        priceRaw: checkoutPrice, //tien truoc khi giam gia
        priceApplyDiscount: checkoutPrice,
        item_products: checkProductServer,
      };

      // new shop_discount ton tai > 0, check xem co hop le hay khong ?
      if (shop_discounts.length > 0) {
        //gia su chi co 1 discount
        //get amount discount
        const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
          codeId: shop_discounts[0].codeId,
          userId,
          shopId,
          products: checkProductServer,
        });
        //Tong cong discount giam gia
        checkout_order.totalDiscount += discount;

        // neu tien giam gia lon hon 0
        if (discount > 0) {
          itemCheckout.priceApplyDiscount = checkoutPrice - discount;
        }
      }
      //   tong thanh toan cuoi cung
      checkout_order.totalCheckout += itemCheckout.priceApplyDiscount;
      shop_order_ids_new.push(itemCheckout);
    }
    return {
      shop_order_ids,
      shop_order_ids_new,
      checkout_order,
    };
  }
  static async orderByUser({
    shop_order_ids,
    cartId,
    userId,
    user_address = {},
    user_payment = {},
  }) {
    const { shop_order_ids_new, checkout_order } =
      await CheckoutService.checkoutReview({
        cartId,
        userId,
        shop_order_ids,
      });

    //check lai mot lan nua xem vuot ton kho hay khong
    // get new array products
    const products = shop_order_ids_new.flatMap((order) => order.item_products);
    console.log(`[1]::::`, products);
    const acquireProduct = [];
    for (let i = 0; i < products.length; i++) {
      const { productId, quantity } = products[i];
      const keyLock = await acquireLock(productId, quantity, cartId);
      acquireProduct.push(keyLock ? true : false);
      if (keyLock) {
        await releaseLock(keyLock);
      }
    }
    //Check if co mot san pham het hang trong kho
    if (acquireProduct.includes(false)) {
      throw new BadRequestError("Some products are out of stock!");
    }

    const newOrder = await order.create({
      order_userId: userId,
      order_checkout: checkout_order,
      order_shipping: user_address,
      order_payment: user_payment,
      order_products: shop_order_ids_new,
    });

    // truong hop: neu insert thanh cong, thi remove product co trong cart
    if (newOrder) {
    }
    return newOrder;
  }

  /*
    1> Query Order [users]
  */
  static async getOrderByUser() {}

  /*
    2> Query Order Using Id [users]
  */
  static async getOneOrderByUser() {}

  /*
    3> Cancel Order [users]
  */
  static async cancelOrderByUser() {}

  /*
    4> Update Order Status [Shop | Admin]
  */
  static async updateOrderStatusByShop() {}
}

module.exports = CheckoutService;
