const express = require("express");
const ProductType = require("../models/productType");
const auth = require("../middleware/auth");
const User = require("../models/user");
const router = new express.Router();

//create product types
router.post("/product-types", auth, async (req, res) => {
  try {
    const name = req.body.name.toLowerCase();
    const existing = await ProductType.find({
      name,
    });
    if (existing.length !== 0) {
      return res.status(403).send({
        message: "type already exists",
      });
    }
    const product_type = new ProductType({
      ...req.body,
      owner: req.user._id,
    });
    await product_type.save();
    res.status(201).send(product_type);
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
});

// get all product types
router.get("/product-types", auth, async (req, res) => {
  try {
    const productTypes = await ProductType.find({});
    res.send(productTypes);
  } catch (error) {
    res.status(500).send();
  }
});

//Get all products in type
router.get("/products/product-types/:productTypeId", auth, async (req, res) => {
  try {
    const productType = await ProductType.findById(req.params.productTypeId);
    if (!productType) {
      return res.status(404).send({
        error: "product type not found",
      });
    }
    await productType.populate({
      path: "products",
      // select:
    });
    res.send(productType.products);
  } catch (error) {
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//update product-type by id
router.patch("/product-types/:product-typeId", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedupdates = ["description", "completed"];
  const isValidOperation = updates.every((update) => {
    return allowedupdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }
  try {
    const product_type = await ProductType.findOne({
      _id: req.params.product_typeId,
      owner: req.user._id,
    });
    if (!product_type) {
      console.log(product_type);
      return res.status(404).send();
    }
    updates.forEach((update) => {
      product_type[update] = req.body[update];
    });
    (await product) - type.save();

    res.send(product_type);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Delete product-type by id
router.delete("/product-types/:product-typeId", auth, async (req, res) => {
  try {
    const product_type = await ProductType.findOneAndDelete({
      _id: req.params.product_typeId,
      owner: req.user._id,
    });
    if (!product_type) {
      return res.status(404).send();
    }
    res.send(product_type);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

module.exports = router;
