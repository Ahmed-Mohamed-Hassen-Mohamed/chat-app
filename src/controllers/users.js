const User = require("../models/users");
const Chat = require("../models/chats");
const jwt = require("jsonwebtoken");
const redisClient = require("../db/redis");
const sendEmail = require("../utils/sendEmail");
const generateOTP = require("../utils/generateOTP");
const ApiError = require("../utils/ApiError");

// Example controller functions

exports.sendEmail = async (req, res, next) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });
    const otp = generateOTP(4);

    const subject = "Verification Code (valid for 1 min)";
    const message = `Hi ${user.firstName}, \nWe received a request to verify Your Email\n${otp}`;
    await sendEmail(email, subject, message);

    const payload = { otp };
    const OTPToken = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1m",
    });

    await redisClient.hSet(email, "OTPToken", OTPToken);
    res.status(200).send({ message: "OTP sent and token generated" });
  } catch (error) {
    next(new ApiError(error.message, 500));
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const _user = await User.findOne({ email });
    if (!_user) {
      return res.status(404).send({ message: "This user is not found" });
    }

    const { OTPToken } = await redisClient.hGetAll(email);
    if (!OTPToken) {
      return res.status(400).send({ message: "OTP token not found" });
    }

    let decoded;
    try {
      decoded = jwt.verify(OTPToken, process.env.SECRET_KEY);
    } catch (error) {
      return res.status(400).send({ message: "Invalid or expired OTP token" });
    }

    if (decoded.otp !== otp) {
      return res.status(400).send({ message: "Invalid OTP" });
    }

    const user = await User.findOneAndUpdate(
      { email: email },
      { flag: true },
      {
        new: true,
      }
    );
    const token = user.generateToken();
    res.status(200).send({ token });
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const email = req.body.email;
    let user = await User.findOne({ email });
    if (user && user.flag) {
      return res
        .status(200)
        .send({ message: "There is an account for this email." });
    }

    const otp = generateOTP(4);

    const subject = "Verification Code (valid for 1 min)";
    const message = `Hi ${user.firstName}, \nWe received a request to verify Your Email\n${otp}`;
    await sendEmail(email, subject, message);

    const payload = { otp };
    const OTPToken = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "30s",
    });

    if (user) {
      await redisClient.hSet(email, "OTPToken", OTPToken);
    } else {
      await redisClient.hSet(email, "OTPToken", OTPToken);
      const user = new User(req.body);
      await user.save();
    }

    res.status(200).send({ message: "OTP sent and token generated" });
  } catch (error) {
    next(new ApiError(error.message, 500));
  }
};

exports.uploadPhoto = async (req, res, next) => {
  try {
    const user = req.user;
    user.profile = req.file.buffer;
    await user.save();
    res.status(200).send({ user });
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.login = async (req, res, next) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    if (user.flag === false) {
      return res.status(401).send({ message: "Email not verified" });
    }
    const token = user.generateToken();
    res.status(200).send({ user, token });
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    if (!users.length) {
      return res
        .status(404)
        .send({ Error: "Not found", message: "Not users is found" });
    }
    res.status(200).send(users);
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.getUsersByEmail = async (req, res, next) => {
  try {
    const email = req.body.email;
    const chats = await Chat.find({
      $or: [{ user1Id: req.user._id }, { user2Id: req.user._id }],
    });
    const userIds = chats.reduce((ids, chat) => {
      if (chat.user1Id.toString() !== req.user._id.toString()) {
        ids.push(chat.user1Id);
      }
      if (chat.user2Id.toString() !== req.user._id.toString()) {
        ids.push(chat.user2Id);
      }
      return ids;
    }, []);
    const users = await User.find({
      _id: { $nin: userIds },
      email: { $regex: email, $options: "i" },
    });
    if (!users.length) {
      return res
        .status(404)
        .send({ Error: "Not found", message: "Not users is found" });
    }
    res.status(200).send(users);
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.getProfile = async (req, res) => {
  res.status(200).send(req.user);
};

exports.getUserById = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const user = await User.findById(_id);
    if (!user) {
      return res
        .status(404)
        .send({ Error: "Not found", message: "This user is not found" });
    }
    res.status(200).send(user);
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.updateUser = async (req, res, next) => {
  const updates = Object.keys(req.body);
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(404)
        .send({ Error: "Not found", message: "This user is not found" });
    }
    updates.forEach((key) => {
      user[key] = req.body[key];
    });
    if (req.file) {
      user.profile = req.file.buffer;
    }
    await user.save();
    res.status(200).send(user);
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send({ Error: "Not found", message: "This user is not found" });
    }
    user.password = password;
    await user.save();
    res.status(200).send(user);
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = req.user;
    const _user = user.deleteOne();
    res.status(200).send("User has been deleted");
  } catch (err) {
    next(new ApiError(error.message, 500));
  }
};
