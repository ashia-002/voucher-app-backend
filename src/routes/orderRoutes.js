const express = require("express");
const router = express.Router();
const { authenticate, authorizeSeller, authorizeBuyer } = require("../middlewares/authentication");
const { getSellerCustomers,  getSellerSummary, getSellerRevenue, placeOrder, getBuyerOrders } = require("../controllers/order-controller");

// 📌 Seller gets list of customers & their vouchers
router.get("/customers", authenticate, authorizeSeller, getSellerCustomers);
// 📌 Seller gets order summary
router.get("/summary", authenticate, authorizeSeller, getSellerSummary);

router.get("/revenue", authenticate, authorizeSeller, getSellerRevenue);


// 📌 Buyer places an order
router.post("/place", authenticate, authorizeBuyer, placeOrder);
// 📌 Buyer views order history
router.get("/buyer-orders", authenticate, authorizeBuyer, getBuyerOrders);

module.exports = router;
