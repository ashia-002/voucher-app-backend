const express = require("express");
const { register, login, googleLogin, googleCallback, logout } = require('../controllers/auth-controllers');

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

//Google Authentication Routes
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

module.exports = router;
