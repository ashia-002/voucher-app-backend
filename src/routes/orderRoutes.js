const express = require("express");
const router = express.Router();
const { authenticate, authorizeSeller, authorizeBuyer } = require("../middlewares/authentication");
const { getSellerCustomers,  getSellerSummary, getSellerRevenue, placeOrder, getBuyerOrders } = require("../controllers/order-controller");

// 📌 Seller gets list of customers & their vouchers
router.get("/seller/customers", authenticate, authorizeSeller, getSellerCustomers);
// 📌 Seller gets order summary
router.get("/seller/summary", authenticate, authorizeSeller, getSellerSummary);

//Seller gets revenue
router.get("/seller/revenue", authenticate, authorizeSeller, getSellerRevenue);


// 📌 Buyer places an order
router.post("/buyer/place", authenticate, authorizeBuyer, placeOrder);
// 📌 Buyer views order history
router.get("/buyer/order-history", authenticate, authorizeBuyer, getBuyerOrders);

module.exports = router;
