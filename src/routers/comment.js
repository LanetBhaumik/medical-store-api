const express = require("express");
const router = new express.Router();

const auth = require("../middleware/auth");

const Comment = require("../models/comment");
const Product = require("../models/product");

//      comment on product
router.post("/products/comments/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send({
        error: "product not found",
      });
    }

    const comment = new Comment({
      ...req.body,
      author: req.user._id,
      product: product._id,
    });
    await comment.save();
    res.status(201).send(comment);
  } catch (error) {
    res.status(500).send({
      error: "Internal server error",
    });
  }
});

//get all comments on product XYZ
router.get("/products/comments/:productId", auth, async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return res.status(404).send({
      error: "product not found",
    });
  }
  await product.populate({
    path: "comments",
    select: "title -product",
    populate: {
      path: "author",
      select: "name -_id",
    },
  });
  res.send(product.comments);
  await product.depopulate("comments");
});

//Get  all Comment and Commented Product of Logged in user
router.get("/users/comments/me", auth, async (req, res) => {
  try {
    await req.user.populate({
      path: "comments",
      select: "title description -author",
      populate: {
        path: "product",
        select: "name",
      },
    });
    res.status(200).send(req.user.comments);
    req.user.depopulate("comments");
  } catch (error) {
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//Delete comment by id
router.delete("/comments/:commentId", auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      owner: req.user._id,
    });
    if (!comment) {
      return res.status(404).send({
        error: "comment not found",
      });
    }
    await comment.remove();
    res.send(comment);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "internal server error",
    });
  }
});

module.exports = router;
