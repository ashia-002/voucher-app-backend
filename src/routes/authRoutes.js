const express = require("express");
const { register, login, googleLogin, googleCallback } = require('../controllers/auth-controllers');

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

//Google Authentication Routes
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

module.exports = router;
