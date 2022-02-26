const mongoose = require("mongoose");
const Like = require("./like");
const Dislike = require("./dislike");
const Comment = require("./comment");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductType",
    },
  },
  {
    timestamps: true,
  }
);

// for getting comments
productSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "product",
});

//for getting likes
productSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "product",
});

//for getting likeCount
productSchema.virtual("likesCount", {
  ref: "Like",
  localField: "_id",
  foreignField: "product",
  count: true,
});

//for getting dislikes
productSchema.virtual("dislikes", {
  ref: "Dislike",
  localField: "_id",
  foreignField: "product",
});

//for getting dislikeCount
productSchema.virtual("dislikesCount", {
  ref: "Dislike",
  localField: "_id",
  foreignField: "product",
  count: true,
});

productSchema.methods.toJSON = function () {
  const product = this;
  const productObject = product.toObject();
  delete productObject.createdAt;
  delete productObject.updatedAt;
  delete productObject.__v;
  return productObject;
};

// Delete product's like, dislike and comment when product is removed.
productSchema.pre("remove", async function (next) {
  const product = this;
  await Like.deleteMany({
    product: product._id,
  });
  await Dislike.deleteMany({
    product: product._id,
  });
  await Comment.deleteMany({
    product: product._id,
  });

  next();
});
productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
