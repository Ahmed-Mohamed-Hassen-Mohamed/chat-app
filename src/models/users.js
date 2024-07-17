const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minlength: "3",
    maxlength: "20",
    validate(value) {
      if (/\s/.test(value)) {
        throw new Error("FirstName must not contain spaces");
      }
    },
  },
  lastName: {
    type: String,
    required: true,
    minlength: "3",
    maxlength: "20",
    validate(value) {
      if (/\s/.test(value)) {
        throw new Error("LastName must not contain spaces");
      }
    },
  },
  gender: {
    type: String,
    required: true,
    enum: ["male", "female"],
  },
  birthDate: {
    type: Date,
    required: true,
    default: () => {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      return currentDate;
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (/\s/.test(value)) {
        throw new Error("Email must not contain spaces");
      }
    },
    match: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/,
  },
  phone: {
    type: String,
    validate: {
      validator: function (v) {
        return /\d{11}/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  profile: {
    type: Buffer,
  },
  registrationDate: {
    type: Date,
    required: true,
    default: () => {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      return currentDate;
    },
  },
  lastLoginDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    validate(value) {
      let regExp = new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"
      );
      if (!regExp.test(value)) {
        throw new Error("Password must include (a-z) && (A-Z) && (0-9)");
      }
    },
  },
  flag: {
    type: Boolean,
    default: false,
  },
});
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcryptjs.hash(this.password, 8);
  }
});

userSchema.pre("remove", async function (next) {
  next();
});

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Please check username or password");
  }
  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Please check username or password");
  }
  return user;
};

userSchema.methods.generateToken = function () {
  const payload = {
    _id: this._id.toString(),
  };
  const token = jwt.sign(payload, process.env.SECRET_KEY);
  return token;
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.flag;
  return userObject;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
