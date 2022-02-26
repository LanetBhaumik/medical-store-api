const express = require("express");
const Product = require("../models/product");
const auth = require("../middleware/auth");
const ProductType = require("../models/productType");
const router = new express.Router();

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
    res.status(400).send(error.message);
  }
});

// // get most liked product     GET /products?mostLiked=true
// router.get("/products", auth, async (req, res) => {
//   try {
//     console.log("new roter called");
//     // most liked product logic
//     // if (req.query.mostLiked) {
//     //   const products = await Product.find().sort();
//     // }

//     // await req.user.populate({
//     //   path: "products",
//     //   options: {
//     //     limit: parseInt(req.query.limit),
//     //     skip: parseInt(req.query.skip),
//     //   },
//     // });

//     if (req.query.mostLiked) {
//       const products = await Product.find();
//     }

//     res.send();
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       error: "internal server error",
//     });
//   }
// });

//GET /products?limit=10&skip=0
//GET /products?sortBy=createdAt:desc

// get most recent product    GET /products?mostRecent=true
// get most liked product     GET /products?mostLiked=true

router.get("/products", auth, async (req, res) => {
  //sorting logic
  const sortOptions = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sortOptions[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  //most recent product logic
  if (req.query.mostRecent) {
    const mostRecentProduct = await Product.find().sort({ createdAt: -1 });
    return res.send(mostRecentProduct[0]);
  }

  try {
    const products = await Product.find().sort(sortOptions);

    //most liked product logic
    if (req.query.mostLiked) {
      let initialProduct = {
        likesCount: 0,
      };
      products.forEach(async (product) => {});
      const mostLikedProduct = await products.reduce(
        async (prevProduct, product) => {
          await product.populate({
            path: "likesCount",
          });
          console.log("inside", product);
          if (product.likesCount > prevProduct.likesCount) {
            return product;
          }
          return prevProduct;
        },
        initialProduct
      );
      return res.send(mostLikedProduct);
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

    await product.populate("likesCount");

    await product.populate("dislikesCount");

    await product.populate({
      path: "comments",
      select: "title description product -author",
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
    const product = await Product.findOneAndDelete({
      _id: req.params.productId,
      owner: req.user._id,
    });
    if (!product) {
      return res.status(404).send();
    }
    res.send(product);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

module.exports = router;
