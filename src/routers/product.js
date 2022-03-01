const express = require("express");
const router = new express.Router();

const auth = require("../middleware/auth");

const Product = require("../models/product");
const ProductType = require("../models/productType");

//new product creation
router.post("/products", auth, async (req, res) => {
  try {
    if (req.body.product_type) {
      const productType = await ProductType.findById(req.body.product_type);
      if (!productType) {
        return res.status(404).send({
          error: "product type is not defined",
        });
      }
    }
    const product = new Product({
      ...req.body,
      owner: req.user._id,
    });

    await product.save();
    res.status(201).send(product);
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(400).send({
        error: `${Object.keys(error.keyValue)} already exists`,
      });
    }
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//sorting                     -GET /products?sortBy=createdAt:desc
// get most recent product    -GET /products?mostRecent=true
// get most liked product     -GET /products?mostLiked=true
router.get("/products", async (req, res) => {
  try {
    if (req.query.mostLiked) {
      req.query.mostLiked = req.query.mostLiked === "true";
    }

    //sorting logic

    const sortOptions = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sortOptions[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }

    //most recent product logic
    if (req.query.mostRecent) {
      const mostRecentProduct = await Product.find()
        .sort({ createdAt: -1 })
        .limit(1);
      return res.send(mostRecentProduct);
    }

    const products = await Product.find().sort(sortOptions).populate({
      path: "_id",
      path: "likesCount",
    });

    //most liked product logic
    if (req.query.mostLiked) {
      products.sort((a, b) => {
        return b.likesCount - a.likesCount;
      });
      return res.send(products[0]);
    }

    res.send(products);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//Get Product by id
router.get("/products/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send({
        error: "product not found",
      });
    }
    await product.populate({
      path: "owner",
      select: "name -_id",
    });

    await product.populate("likesCount");

    await product.populate("dislikesCount");

    await product.populate({
      path: "comments",
      select: "title description -product author",
      options: {
        limit: 5,
        sort: {
          createdAt: -1,
        },
        populate: {
          path: "author",
          select: "name -_id",
        },
      },
    });

    res.send({
      product,
      likeCount: product.likesCount,
      dislikeCount: product.dislikesCount,
      recentComments: product.comments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "Internal Server Error",
    });
  }
});

//update product by id
router.patch("/products/:productId", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  if (updates.includes("expiry_date")) {
    return res.status(403).send({
      error: "can not update expiry date",
    });
  }
  const allowedupdates = ["name", "price", "description", "product_type"];
  const isValidOperation = updates.every((update) => {
    return allowedupdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      owner: req.user._id,
    });
    if (!product) {
      console.log(product);
      return res.status(404).send();
    }
    updates.forEach((update) => {
      product[update] = req.body[update];
    });
    await product.save();

    res.send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Delete product by id
router.delete("/products/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      owner: req.user._id,
    });
    if (!product) {
      return res.status(404).send({
        error: "product not found or you do not have permission to delete",
      });
    }
    await product.remove();
    res.send(product);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "internal server error",
    });
  }
});

module.exports = router;
