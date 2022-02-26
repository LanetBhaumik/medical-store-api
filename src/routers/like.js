const express = require("express");
const Like = require("../models/like");
const auth = require("../middleware/auth");
const Product = require("../models/product");
const User = require("../models/user");
const router = new express.Router();

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

//get all likes?completed=false
//GET /like?limit=10&skip=0
//GET /likes?sortBy=createdAt:desc
router.get("/likes-count/:productId", auth, async (req, res) => {
  console.log("right");
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }
  try {
    await req.user.populate({
      path: "likes",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.send(req.user.likes);
  } catch (error) {
    res.status(500).send();
  }
});

//get like by id
router.get("/likes/:likeId", auth, async (req, res) => {
  try {
    // await req.user.populate("likes");
    // const userLikes = user.likes;
    // const like = await userLikes.find((tsk) => {
    //   return tsk._id === req.params.likeId;
    // });

    const _id = req.params.likeId;
    const like = await Like.findOne({ _id, owner: req.user._id });
    console.log(like);
    if (!like) {
      return res.status(404).send();
    }
    res.send(like);
  } catch (error) {
    res.status(500).send();
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
      return res.status(404).send();
    }
    res.send(like);
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
});

module.exports = router;
