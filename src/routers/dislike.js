const express = require("express");
const router = new express.Router();

const auth = require("../middleware/auth");

const Dislike = require("../models/dislike");
const Product = require("../models/product");

//Dislike the product
router.post("/products/dislikes/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send({
        error: "product not found",
      });
    }
    await product.populate({
      path: "dislikes",
      match: {
        author: req.user._id,
      },
    });
    if (product.dislikes.length == 1) {
      return res.status(400).send({
        error: "already disliked",
      });
    }
    await product.depopulate("dislikes");
    const dislike = new Dislike({
      author: req.user._id,
      product: req.params.productId,
    });
    await dislike.save();
    res.status(201).send({
      success: "disliked",
    });
  } catch (error) {
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//get all dislikes on product XYZ
router.get("/dislikes/:productId", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send({
        error: "product not found",
      });
    }
    await product.populate({
      path: "dislikes",
      select: "author -_id -product",
      populate: {
        path: "author",
        select: "name email -_id",
      },
    });
    res.status(200).send({
      dislikeCount: product.dislikes.length,
      dislikes: product.dislikes,
    });
    product.depopulate("dislikes");
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//Get  all Disliked Product of Logged in user
router.get("/users/dislikes/me", auth, async (req, res) => {
  try {
    await req.user.populate({
      path: "dislikes",
      select: "product -author",
      populate: {
        path: "product",
        select: "name",
      },
    });
    res.status(200).send(req.user.dislikes);
    req.user.depopulate("dislikes");
  } catch (error) {
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//Delete  dislike by id
router.delete("/dislikes/:dislikeId", auth, async (req, res) => {
  try {
    const dislike = await Dislike.findOneAndDelete({
      _id: req.params.dislikeId,
      owner: req.user._id,
    });
    if (!dislike) {
      return res.status(404).send({
        error: "you have not disliked",
      });
    }
    res.send({
      success: "dislike deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "internal server error",
    });
  }
});

module.exports = router;
