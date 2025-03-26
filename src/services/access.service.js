"use strict";

const shopModel = require("../models/shop.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const { OK } = require("../core/success.response");

// Services ///
const { findByEmail } = require("./shop.service");

const RoleShop = {
  SHOP: "SHOP",
  WRITER: "00001",
  EDITOR: "00002",
  ADMIN: "00003",
};

class AccessService {
  /*
    check token used
  */

  static handleRefreshTokenV2 = async ({ keyStore, user, refreshToken }) => {
    const { userId, email } = user;

    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened !! please relogin");
    }

    if (keyStore.refreshToken !== refreshToken)
      throw new AuthFailureError("Shop not found");

    const foundShop = await findByEmail({ email });
    if (!foundShop) throw new AuthFailureError("Shop not found");

    // create 1 cap moi
    const tokens = await createTokenPair(
      { userId, email },
      keyStore.publicKey,
      keyStore.privateKey
    );

    //update token ------- note:::: update() ==> updateOne()
    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, //Đã được sử dụng để lấy token mới thì add vào
      },
    });

    return {
      user,
      tokens,
    };
  };

  static handleRefreshToken = async (refreshToken) => {
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(
      refreshToken
    );
    if (foundToken) {
      // decode xem mày là thằng nào????
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );

      console.log({ userId, email });
      //Xoa
      await KeyTokenService.deleteKeyById(userId);
      throw new ForbiddenError("Something wrong happened || please relogin");
    }

    // No (Chưa có) -> beautiful
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);

    if (!holderToken) throw new AuthFailureError("Shop not found");

    // verify token
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );

    console.log("[2]:::: ", { userId, email });

    // check userId
    const foundShop = await findByEmail({ email });
    if (!foundShop) throw new AuthFailureError("Shop not found");

    // create 1 cap moi
    const tokens = await createTokenPair(
      { userId, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    //update token ------- note:::: update() ==> updateOne()
    await holderToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken, //Đã được sử dụng để lấy token mới thì add vào
      },
    });

    return {
      user: { userId, email },
      tokens,
    };
  };

  static logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id);
    console.log("delKey::::", { delKey });
    return delKey;
  };

  /*
    1 - Check email in dbs
    2 - Match password
    3 - create AT & RT then save dbs
    4 - Generate token
    5 - Get data return login
  */

  static login = async ({ email, password, refreshToken = null }) => {
    //1.
    const foundShop = await findByEmail({ email });
    if (!foundShop) {
      throw new BadRequestError("Error: Shop Invalid");
    }

    //2.
    const match = bcrypt.compare(password, foundShop.password);
    if (!match) {
      throw new AuthFailureError("Authentication Error");
    }

    //3.
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    //4.
    const { _id: userId } = foundShop;
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      userId,
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
    });

    return {
      shop: getInfoData({
        fields: ["_id", "name", "email"],
        object: foundShop,
      }),
      tokens,
    };
  };

  static signUp = async ({ name, email, password }) => {
    // step 1: check email exists??
    const holderShop = await shopModel.findOne({ email }).lean(); //return object javascript original
    if (holderShop) {
      throw new BadRequestError("Error: Shop already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    });

    if (newShop) {
      // Thuật toán bất đối xứng - rsa
      // created privateKey, publicKey
      // const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      //   modulusLength: 4096,
      //   publicKeyEncoding: {
      //     type: "pkcs1", //public key cryptography standards 1
      //     format: "pem", //in PEM format (Privacy-Enhanced Mail)
      //   },
      //   privateKeyEncoding: {
      //     type: "pkcs1",
      //     format: "pem",
      //   },
      // });

      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");

      console.log({ privateKey, publicKey });

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey, //version 2 more simple
      });

      if (!keyStore) {
        throw new BadRequestError("Error: Key Store could not be created");
      }

      // created token pair
      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      );
      console.log(`Created token Success:: `, tokens);
      return {
        code: 201,
        metadata: {
          shop: getInfoData({
            fields: ["_id", "name", "email"],
            object: newShop,
          }),
          tokens,
        },
      };
    }
    return {
      code: 200,
      metadata: null,
    };
  };
}

module.exports = AccessService;
