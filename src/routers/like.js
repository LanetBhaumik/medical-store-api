const express = require("express");
const router = new express.Router();

const auth = require("../middleware/auth");

const Like = require("../models/like");
const Product = require("../models/product");

//Like the product
router.post("/products/likes/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send({
        error: "product not found",
      });
    }
    await product.populate({
      path: "likes",
      match: {
        author: req.user._id,
      },
    });
    if (product.likes.length == 1) {
      return res.status(400).send({
        error: "already liked",
      });
    }
    await product.depopulate("likes");

    const like = new Like({
      author: req.user._id,
      product: req.params.productId,
    });
    await like.save();
    res.status(201).send({
      success: "liked",
    });
  } catch (error) {
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//get all likes on product XYZ
router.get("/likes/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send({
        error: "product not found",
      });
    }
    await product.populate({
      path: "likes",
      select: "author -_id -product",
      populate: {
        path: "author",
        select: "name email -_id",
      },
    });
    res.status(200).send({
      likeCount: product.likes.length,
      likes: product.likes,
    });
    product.depopulate("likes");
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//Get  all Liked Product of Logged in user
router.get("/users/likes/me", auth, async (req, res) => {
  try {
    await req.user.populate({
      path: "likes",
      select: "product -author",
      populate: {
        path: "product",
        select: "name",
      },
    });
    res.status(200).send(req.user.likes);
    req.user.depopulate("likes");
  } catch (error) {
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//Delete like by id
router.delete("/likes/:likeId", auth, async (req, res) => {
  try {
    const like = await Like.findOneAndDelete({
      _id: req.params.likeId,
      owner: req.user._id,
    });
    if (!like) {
      return res.status(404).send({
        error: "you have not liked",
      });
    }
    res.send({
      success: "like deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "internal server error",
    });
  }
});

module.exports = router;
