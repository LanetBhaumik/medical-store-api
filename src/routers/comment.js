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

//get all comments?completed=false
//GET /comment?limit=10&skip=0
//GET /comments?sortBy=createdAt:desc
router.get("/comments", auth, async (req, res) => {
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
      path: "comments",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.send(req.user.comments);
  } catch (error) {
    res.status(500).send();
  }
});

//get comment by id
router.get("/comments/:commentId", auth, async (req, res) => {
  try {
    // await req.user.populate("comments");
    // const userComments = user.comments;
    // const comment = await userComments.find((tsk) => {
    //   return tsk._id === req.params.commentId;
    // });

    const _id = req.params.commentId;
    const comment = await Comment.findOne({ _id, owner: req.user._id });
    console.log(comment);
    if (!comment) {
      return res.status(404).send();
    }
    res.send(comment);
  } catch (error) {
    res.status(500).send();
  }
});

//update comment by id
router.patch("/comments/:commentId", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedupdates = ["description", "completed"];
  const isValidOperation = updates.every((update) => {
    return allowedupdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }
  try {
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      owner: req.user._id,
    });
    if (!comment) {
      console.log(comment);
      return res.status(404).send();
    }
    updates.forEach((update) => {
      comment[update] = req.body[update];
    });
    await comment.save();

    res.send(comment);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

//Delete comment by id
router.delete("/comments/:commentId", auth, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.commentId,
      owner: req.user._id,
    });
    if (!comment) {
      return res.status(404).send();
    }
    res.send(comment);
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
});

module.exports = router;
