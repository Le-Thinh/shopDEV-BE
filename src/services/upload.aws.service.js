"use strict";

const {
  s3,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("../configs/s3.config");

const cloudinary = require("../configs/cloudinary.config");
const crypto = require("crypto");
const randomImageName = () => crypto.randomBytes(16).toString("hex");
const urlImagePublic = process.env.AWS_BUCKET_CLOUDFRONT_URL;
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");

// Upload file use S3Client
// 1. Upload from image local
const uploadImageFromLocalS3 = async ({ file }) => {
  try {
    //   That is what you need

    const imageName = randomImageName();
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: imageName,
      Body: file.buffer,
      ContentType: "image/jpeg",
    });

    // export url

    const result = await s3.send(command);
    console.log("result upload::::", result);

    // ------- @aws-sdk/s3-request-presigner -------
    // const singedUrl = new GetObjectCommand({
    //   Bucket: process.env.AWS_BUCKET_NAME,
    //   Key: imageName,
    // });

    // const url = await getSignedUrl(s3, singedUrl, {
    //   expiresIn: 3600,
    // });

    // return {
    //   url: `${urlImagePublic}/${imageName}`,
    //   result,
    // };

    // ------- @aws-sdk/cloudfront-signer -------

    // ---------------------------------------------- //

    const url = getSignedUrl({
      url: `${urlImagePublic}/${imageName}`,
      keyPairId: process.env.AWS_BUCKET_CLOUDFRONT_PUBLIC_KEY,
      dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 2), //Expire 1p
      privateKey: process.env.AWS_BUCKET_CLOUDFRONT_PRIVATE_KEY,
    });
    console.log("url:::", url);

    return {
      url,
      result,
    };

    // ---------------------------------------------- //

    // return {
    //   image_url: result.secure_url,
    //   shopId: 8409,
    //   thumb_ulr: await cloudinary.url(result.public_id, {
    //     height: 100,
    //     width: 100,
    //     format: "jpg",
    //   }),
    // };
  } catch (error) {
    console.error("Error uploading image using S3Client", error);
  }
};

module.exports = { uploadImageFromLocalS3 };
