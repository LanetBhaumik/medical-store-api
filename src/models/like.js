const mongoose = require("mongoose");
const likeSchema = new mongoose.Schema(
  {
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

likeSchema.methods.toJSON = function () {
  const like = this;
  const likeObject = like.toObject();
  delete likeObject.createdAt;
  delete likeObject.updatedAt;
  delete likeObject.__v;
  return likeObject;
};

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;
