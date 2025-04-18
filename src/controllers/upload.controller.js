"use strict";

const { BadRequestError } = require("../core/error.response");
const { SuccessResponse } = require("../core/success.response");
const {
  uploadImageFromUrl,
  uploadImageFromLocal,
  uploadImageFromLocalFiles,
} = require("../services/upload.service");

const { uploadImageFromLocalS3 } = require("../services/upload.aws.service");

class UploadController {
  uploadFile = async (req, res, next) => {
    new SuccessResponse({
      message: "upload Image successfully",
      metadata: await uploadImageFromUrl(),
    }).send(res);
  };

  uploadFileThumb = async (req, res, next) => {
    const { file } = req;
    if (!file) throw new BadRequestError("File missing");
    new SuccessResponse({
      message: "upload Image Thumb successfully",
      metadata: await uploadImageFromLocal({
        path: file.path,
      }),
    }).send(res);
  };

  uploadImageFromLocalFiles = async (req, res, next) => {
    const { files } = req;
    if (!files.length) throw new BadRequestError("File missing");
    new SuccessResponse({
      message: "upload Image Thumb successfully",
      metadata: await uploadImageFromLocalFiles({
        files,
      }),
    }).send(res);
  };

  // AWS
  uploadImageFromLocalS3 = async (req, res, next) => {
    const { file } = req;
    if (!file) throw new BadRequestError("File missing");
    new SuccessResponse({
      message: "upload Image Thumb use S3Client successfully",
      metadata: await uploadImageFromLocalS3({
        file,
      }),
    }).send(res);
  };
}

module.exports = new UploadController();
