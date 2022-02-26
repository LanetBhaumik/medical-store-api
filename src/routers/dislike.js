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

    const dislike = new Dislike({
      author: req.user._id,
      product: req.params.productId,
    });
    await dislike.save();
    res.status(201).send({
      success: "disliked",
    });
  } catch (error) {
    if (error.code == 11000) {
      return res.status(400).send({
        error: "already disliked",
      });
    }
    res.status(400).send(error.message);
  }
});

//get all likes on product XYZ
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
    console.log(product);
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

//get all likes?completed=false
//GET /like?limit=10&skip=0
//GET /likes?sortBy=createdAt:desc
router.get("/likes", auth, async (req, res) => {
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

//get  dislikeby id
router.get("/likes/:likeId", auth, async (req, res) => {
  try {
    // await req.user.populate("likes");
    // const userDislikes = user.likes;
    // const  dislike= await userDislikes.find((tsk) => {
    //   return tsk._id === req.params.likeId;
    // });

    const _id = req.params.likeId;
    const dislike = await Dislike.findOne({ _id, owner: req.user._id });
    console.log(like);
    if (!like) {
      return res.status(404).send();
    }
    res.send(like);
  } catch (error) {
    res.status(500).send();
  }
});

//Delete  dislikeby id
router.delete("/likes/:likeId", auth, async (req, res) => {
  try {
    const dislike = await Dislike.findOneAndDelete({
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
