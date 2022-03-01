const mongoose = require("mongoose");
const productTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

//for getting products
productTypeSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "product_type",
});

productTypeSchema.methods.toJSON = function () {
  const productType = this;
  const productTypeObject = productType.toObject();
  delete productTypeObject.createdAt;
  delete productTypeObject.updatedAt;
  delete productTypeObject.__v;
  return productTypeObject;
};

const ProductType = mongoose.model("Product_type", productTypeSchema);

module.exports = ProductType;
