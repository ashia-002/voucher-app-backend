const express = require("express");
const { processSubscriptionPayment, handlePaymentSuccess } = require("../controllers/subscriptionPayment-controller");
const { authorizeSeller, authenticate } = require("../middlewares/authentication");
const router = express.Router();

//POST /api/subscription/seller/subscribe
router.post("seller/subscribe", authenticate, authorizeSeller, processSubscriptionPayment);

//POST /api/subscription/seller/payment-success
router.post("seller/payment-success", authenticate, authorizeSeller, handlePaymentSuccess);

module.exports = router;