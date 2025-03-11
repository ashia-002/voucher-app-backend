const express = require("express");
const router = express.Router();
const{addVoucher, getSellerVouchers, getExpiredVouchers,
    updateVoucher, deleteVoucher, getSellerVoucherStats, getStoreCards, getStoreDetails
} = require("../controllers/voucher-controller");

const { authenticate, authorizeSeller, authorizeBuyer } = require("../middlewares/authentication");

// 🟢 Buyer Routes
router.get("/stores", authenticate, authorizeBuyer, getStoreCards); // Get all store cards
router.get("/store/:storeId", authenticate, authorizeBuyer, getStoreDetails); // Get store details & vouchers

// 🔵 Public Route (No Authentication)
// router.get("/active", getSellerVouchers); // Get all active vouchers (accessible to everyone)

// 🔵 Seller Routes (Protected)
router.post("/add", authenticate, authorizeSeller, addVoucher); // Add voucher
router.get("/seller", authenticate, authorizeSeller, getSellerVouchers); // Get seller's active vouchers
router.get("/seller/expired", authenticate, authorizeSeller, getExpiredVouchers); // Get seller's expired vouchers
router.put("/:voucherId", authenticate, authorizeSeller, updateVoucher); // Update voucher
router.delete("/:voucherId", authenticate, authorizeSeller, deleteVoucher); // Delete voucher
router.get("/seller/voucher-stats", authenticate, authorizeSeller, getSellerVoucherStats); //Voucher Stats

module.exports = router;
