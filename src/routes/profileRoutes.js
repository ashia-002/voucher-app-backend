const express = require("express");
const { viewProfile, updateProfile, changePassword } = require("../controllers/profile-controller");
const { authenticate } = require("../middlewares/authentication");
const upload = require("../middlewares/upload-middleware");

const router = express.Router();

router.get("/view-profile", authenticate, viewProfile); // View profile (Buyer & Seller)
router.put("/update-profile", authenticate, upload.single("profileImage"), updateProfile); // Update profile (Buyer & Seller)
router.put("/change-password", authenticate, changePassword); // Change password (Buyer & Seller) when yser remembers the old password

module.exports = router;
