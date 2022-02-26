const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.methods.toJSON = function () {
  const comment = this;
  const commentObject = comment.toObject();
  delete commentObject.createdAt;
  delete commentObject.updatedAt;
  delete commentObject.__v;
  return commentObject;
};

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
