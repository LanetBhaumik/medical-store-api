const mongoose = require("mongoose");
const dislikeSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
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

dislikeSchema.methods.toJSON = function () {
  const dislike = this;
  const dislikeObject = dislike.toObject();
  delete dislikeObject.createdAt;
  delete dislikeObject.updatedAt;
  delete dislikeObject.__v;
  return dislikeObject;
};

const Dislike = mongoose.model("Dislike", dislikeSchema);

module.exports = Dislike;
