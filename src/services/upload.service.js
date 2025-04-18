"use strict";

const cloudinary = require("../configs/cloudinary.config");

// 1. Upload from url image
const uploadImageFromUrl = async () => {
  try {
    const urlImage =
      "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m7zll6g4c41ad5";
    const folderName = "product/shopId",
      newFileName = "testdemo";

    const result = await cloudinary.uploader.upload(urlImage, {
      public_id: newFileName,
      folder: folderName,
    });

    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
  }
};

// 2. Upload from image local
const uploadImageFromLocal = async ({ path, folderName = "product/8409" }) => {
  try {
    const result = await cloudinary.uploader.upload(path, {
      public_id: "thumb",
      folder: folderName,
    });

    console.log(result);
    return {
      image_url: result.secure_url,
      shopId: 8409,
      thumb_ulr: await cloudinary.url(result.public_id, {
        height: 100,
        width: 100,
        format: "jpg",
      }),
    };
  } catch (error) {
    console.error(error);
  }
};

// 2. Upload from image local
const uploadImageFromLocalFiles = async ({
  files,
  folderName = "product/8409",
}) => {
  try {
    console.log(`Files:: `, files, folderName);
    if (!files.length) return;
    const uploadedUrls = [];
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        // public_id: "thumb",
        folder: folderName,
      });
      uploadedUrls.push({
        image_url: result.secure_url,
        shopId: 8409,
        thumb_ulr: await cloudinary.url(result.public_id, {
          height: 100,
          width: 100,
          format: "jpg",
        }),
      });
    }

    console.log(uploadedUrls);
    return uploadedUrls;
  } catch (error) {
    console.error("", error);
  }
};

module.exports = {
  uploadImageFromUrl,
  uploadImageFromLocal,
  uploadImageFromLocalFiles,
};
