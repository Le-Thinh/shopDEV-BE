"use strict";

const { SuccessResponse } = require("../core/success.response");
const { createAPIKey } = require("../services/apikey.service");

class ApiKeyController {
  createAPIKey = async (req, res, next) => {
    new SuccessResponse({
      message: "API Key created successfully",
      metadata: await createAPIKey(req.body),
    }).send(res);
  };
}

module.exports = new ApiKeyController();
