"use strict";

const { SuccessResponse } = require("../core/success.response");
const {
  createComment,
  getCommentsByParentId,
  deleteComment,
} = require("../services/comment.service");

class CommentController {
  createComment = async (req, res, next) => {
    new SuccessResponse({
      message: "Create new comment successfully",
      metadata: await createComment(req.body),
    }).send(res);
  };

  deleteComment = async (req, res, next) => {
    new SuccessResponse({
      message: "Delete comment successfully",
      metadata: await deleteComment(req.body),
    }).send(res);
  };

  getCommentsByParentId = async (req, res, next) => {
    new SuccessResponse({
      message: "Get comments successfully",
      metadata: await getCommentsByParentId(req.query),
    }).send(res);
  };
}

module.exports = new CommentController();
