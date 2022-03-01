const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const Product = require("./product");
const ProductType = require("./productType");
const Like = require("./like");
const Dislike = require("./dislike");
const Comment = require("./comment");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: [7, "password must be 7 or more characters"],
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("password field must not contains word 'password'.");
        }
      },
    },
    avatar: {
      type: Buffer,
    },
    // comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    // likes: [{ type: Schema.Types.ObjectId, ref: "Like" }],
    // dislikes: [{ type: Schema.Types.ObjectId, ref: "Dislike" }],
    // products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    // productTypes: [{ type: Schema.Types.ObjectId, ref: "ProductType" }],
  },
  {
    timestamps: true,
  }
);

// for getting all products created by XYZ user
userSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "owner",
});

// for getting all products created by XYZ user
userSchema.virtual("productTypes", {
  ref: "ProductType",
  localField: "_id",
  foreignField: "owner",
});

//for getting likes
userSchema.virtual("likes", {
  ref: "Like",
  localField: "_id",
  foreignField: "author",
});

//for getting dislikes
userSchema.virtual("dislikes", {
  ref: "Dislike",
  localField: "_id",
  foreignField: "author",
});

// for getting all comments commented by XYZ user
userSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "author",
});

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  await user.save();
  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  delete userObject.createdAt;
  delete userObject.updatedAt;
  delete userObject.__v;
  return userObject;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to login");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};

//Hash the plain text password before saving
userSchema.pre("save", async function (next) {
  const user = this; //'this' is a document that is going to be save.
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next(); // it runs after function runs
});

// Delete user's product, producttype, like, dislike, comment when user is removed.
userSchema.pre("remove", async function (next) {
  const user = this;
  await Product.deleteMany({
    owner: user._id,
  });
  await ProductType.deleteMany({
    owner: user._id,
  });
  await Like.deleteMany({
    author: user._id,
  });
  await Dislike.deleteMany({
    author: user._id,
  });
  await Comment.deleteMany({
    author: user._id,
  });

  next();
});

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
