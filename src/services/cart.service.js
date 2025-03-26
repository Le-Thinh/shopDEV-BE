"use strict";

const { cart } = require("../models/cart.model");
const { BadRequestError, NotFoundError } = require("../core/error.response");
const {
  createUserCart,
  updateUserCartQuantity,
  checkAllProductsUserCart,
} = require("../models/repositories/cart.repo");
const { getProductById } = require("../models/repositories/product.repo");

/*
    Key features: Cart services
     - Add product to cart [User]
     - Reduce product quantity by one [User]
     - Increase product quantity by one [User]
     - Get cart [User]
     - Delete cart [User]
     - Delete cart item [User]
 */

class CartService {
  static async addToCart({ userId, product = {} }) {
    // check cart exists?
    const userCart = await cart.findOne({ cart_userId: userId });

    if (!userCart) {
      // create cart for User

      return await createUserCart({ userId, product, model: cart });
    }

    // If there is a cart but no products in it.
    if (!userCart.cart_products.length) {
      userCart.cart_products = [product];
      return await userCart.save();
    }

    const checkExistProductInCart = userCart.cart_products.some(
      (p) => p.productId === product.productId
    );

    console.log("checkExistProductInCart::::", checkExistProductInCart);

    if (!checkExistProductInCart) {
      userCart.cart_products.push(product);
      return await userCart.save();
    }

    //If the cart exists and contains this product, then update the quantity
    return await updateUserCartQuantity({ userId, product, model: cart });
  }

  //update cart
  /*
    shop_order_ids: [
      {
        shopId,
        item_products: [
          {
            quantity,
            price,
            shopId,
            old_quantity,
            productId,
          }
        ],
        version:
      }
    ]
  */
  static async addToCartV2({ userId, shop_order_ids }) {
    const { productId, quantity, old_quantity } =
      shop_order_ids[0]?.item_products[0];

    console.log(shop_order_ids[0]?.item_products[0]);

    // Check product
    const foundProduct = await getProductById(productId);
    if (!foundProduct) throw new NotFoundError("Not found product");

    // compare
    if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) {
      throw new NotFoundError("Product do not belong to the shop");
    }

    if (quantity === 0) {
      //delete product from cart
    }

    return await updateUserCartQuantity({
      userId,
      product: {
        productId,
        quantity: quantity - old_quantity,
      },
      model: cart,
    });
  }

  static async deleteUserCart({ userId, productId }) {
    const query = { cart_userId: userId, cart_state: "active" };
    const updateSet = {
      $pull: {
        cart_products: { productId },
      },
    };

    const deleteCart = await cart.updateOne(query, updateSet);

    return deleteCart;
  }

  static async getListCart({ userId }) {
    return await cart
      .findOne({
        cart_userId: +userId,
      })
      .lean();
  }
}

module.exports = CartService;
