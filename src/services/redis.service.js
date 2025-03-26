"use strict";

const { resolve } = require("path");
const redis = require("redis");
const { promisify } = require("util");
const {
  reservationInventory,
} = require("../models/repositories/inventory.repo");
const { error } = require("console");
const { result } = require("lodash");
const redisClient = redis.createClient();

redisClient.ping((error, result) => {
  if (error) {
    console.error(`Error connect to Redis::`, error);
  } else {
    console.log(`Connected to Redis!!!`);
  }
});

const pexpire = promisify(redisClient.pexpire).bind(redisClient);
const setnxAsync = promisify(redisClient.setnx).bind(redisClient);

const acquireLock = async (productId, quantity, cartId) => {
  const key = `lock_v2024_${productId}`;
  const retryTimes = 10;
  const expireTime = 3000; //3seconds

  for (let i = 0; i < retryTimes; i++) {
    // tao mot key, thang nao nam giu duoc vao thanh toan
    const result = await setnxAsync(key, expireTime);
    console.log(`result::::`, result);
    if (result === 1) {
      const isReservation = await reservationInventory({
        productId,
        quantity,
        cartId,
      });

      if (isReservation.modifiedCount) {
        await pexpire(key, expireTime);
        return key;
      }
      //thao tac voi inventory
      return null;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
};

const releaseLock = async (keyLock) => {
  const delAsyncKey = promisify(redisClient.del).bind(redisClient);
  return await delAsyncKey(keyLock);
};

module.exports = {
  acquireLock,
  releaseLock,
};
