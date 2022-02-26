const express = require("express");
const User = require("../models/user");
const sharp = require("sharp");
const auth = require("../middleware/auth");
const multer = require("multer");
const { append } = require("express/lib/response");
const router = new express.Router();

//new user creation
router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user: user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

//get all user
router.get("/users", auth, async (req, res) => {
  const users = await User.find({});

  res.status(200).send(users);
});

//user login
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send({
      error: "bad request",
    });
  }
});

//user logout
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send({
      success: "logout success",
    });
  } catch (error) {
    res.status(500).send({
      error: "Internal server error",
    });
  }
});

//logout all sessions
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

//read profile
router.get("/users/me", auth, async (req, res) => {
  try {
    const user = req.user;
    await user.populate({
      path: "products",
      select: "name description -owner",
      options: {
        limit: 5,
        sort: {
          createdAt: -1,
        },
      },
    });
    await user.populate({
      path: "likes",
      select: "product -author",
      options: {
        limit: 5,
        sort: {
          createdAt: -1,
        },
        populate: {
          path: "product",
          select: "name description -_id",
        },
      },
    });
    await user.populate({
      path: "dislikes",
      select: "product -author",
      options: {
        limit: 5,
        sort: {
          createdAt: -1,
        },
        populate: {
          path: "product",
          select: "name description -_id",
        },
      },
    });
    await user.populate({
      path: "comments",
      select: "title description product -author",
      options: {
        limit: 5,
        sort: {
          createdAt: -1,
        },
        populate: {
          path: "product",
          select: "name -_id",
        },
      },
    });
    const recentProducts = user.products;
    const recentLikes = user.likes;
    const recentDislikes = user.dislikes;
    const recentComments = user.comments;

    res.send({
      profile: user,
      recentProducts,
      recentLikes,
      recentDislikes,
      recentComments,
    });
  } catch (error) {
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//get all products by user XYZ
router.get("/users/products/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).send("User doesn't exists");
    }
    await user.populate({
      path: "products",
      select: "name -owner",
    });
    res.send(user.products);
    user.depopulate("products");
  } catch (error) {
    res.status(500).send({
      error: "internal server error",
    });
  }
});

//get all productTypes by user XYZ
router.get("/users/productTypes/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).send("User doesn't exists");
    }
    await user.populate("productTypes");
    res.send(user.productTypes);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//update logged in user
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedupdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) => {
    return allowedupdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }
  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Delete loggedin user
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (error) {
    res.status(500).send(e);
  }
});

//Upload avatar
const upload = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpef|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  },
  limits: {
    fileSize: 1000000,
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

//delete avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

//GET image (Avatar) by user id
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send(error);
  }
});
module.exports = router;
