const express = require("express");
const router = express.Router();
const { login, getAdminCustomers, getAdminSellers, addVoucher, getAllActiveVouchers, getAllExpiredVouchers, deleteVoucher, updateVoucher, getAdminStats, deleteSeller, sendAdminNotification } = require("../controllers/admin-controller");

// Middleware to protect routes and ensure the user is an admin
const {authorizeAdmin} = require("../middlewares/authentication");

// Admin login route
router.post("/login", login);

// Get all customers who bought from the admin
router.get("/customers", authorizeAdmin, getAdminCustomers);

// Get all sellers
router.get("/sellers", authorizeAdmin, getAdminSellers);

// DELETE a perticular seller
router.delete("/delete-seller/:sellerId", authorizeAdmin, deleteSeller);

// Add voucher (Admin)
router.post("/vouchers", authorizeAdmin, addVoucher);

// Get all active vouchers for the admin
router.get("/vouchers/active", authorizeAdmin, getAllActiveVouchers);

// Get all expired vouchers for the admin
router.get("/vouchers/expired", authorizeAdmin, getAllExpiredVouchers);

// Update voucher (Admin)
router.put("/vouchers/:voucherId", authorizeAdmin, updateVoucher);

// Delete voucher (Admin)
router.delete("/vouchers/delete/:voucherId", authorizeAdmin, deleteVoucher);

// Get admin dashboard
router.get("/admin-stats", authorizeAdmin, getAdminStats);

router.post("/send-notification", authorizeAdmin, sendAdminNotification);

module.exports = router;
