const express = require("express");
const router = express.Router();
const multer = require("multer");
const userAuth = require("../middelware/userAuth");
const users = require("../controllers/users");

const upload = multer({
  fileFilter(req, file, cd) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|jfif)$/)) {
      return cd(new Error("Please upload image"));
    }
    cd(null, true);
  },
});

router.post("/signUp", users.createUser);

router.post(
  "/uploadPhoto",
  userAuth,
  upload.single("profile"),
  users.uploadPhoto
);

router.post("/signIn", users.login);
router.post("/sendEmail", users.sendEmail);
router.post("/verifyOTP", users.verifyOTP);
router.patch("/updatePassword", users.updatePassword);

router.post("/search", userAuth, users.getUsersByEmail);

router.get("/", userAuth, users.getUsers);
router.get("/profile", userAuth, users.getProfile);
router.get("/users/:id", userAuth, users.getUserById);
router.patch("/users", userAuth, upload.single("profile"), users.updateUser);
router.delete("/users/:id", userAuth, users.deleteUser);

module.exports = router;
