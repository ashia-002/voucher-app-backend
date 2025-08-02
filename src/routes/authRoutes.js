const express = require("express");
const { register, login, googleLogin, googleCallback, logout,  verifyEmail, requestPasswordReset, resetPassword, firebaseAuth, deleteProfile} = require('../controllers/auth-controllers');
const {firebaseAuthMiddleware} = require('../middlewares/authentication');

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

//Google Authentication Routes
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

//Password Reset Routes
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

//Email Verification
router.get("/verify-email", verifyEmail);

router.post("/firebase-auth", firebaseAuth);
router.get("/profile", firebaseAuthMiddleware, (req, res) => {
  res.json({ user: req.user });
});

//user profile delete
router.delete("/profile/delete", deleteProfile)


module.exports = router;
