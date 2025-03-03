const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart-controller");
const { authenticate, authorizeBuyer } = require("../middlewares/authentication");

// Apply authentication for all cart routes
router.post("/add", authenticate, authorizeBuyer, cartController.addToCart);
router.get("/", authenticate, authorizeBuyer, cartController.getCart);
router.delete("/remove/:voucherId", authenticate, authorizeBuyer, cartController.removeFromCart);
router.get("/summary", authenticate, authorizeBuyer, cartController.getCartSummary);
router.delete("/clear", authenticate, authorizeBuyer, cartController.clearCart);
router.post("/checkout/stripe", authenticate, authorizeBuyer, cartController.checkoutWithStripe);
router.post("/checkout/paypal", authenticate, authorizeBuyer, cartController.checkoutWithPayPal);
router.get("/paypal/success", authenticate, authorizeBuyer, cartController.paypalSuccess);
router.get("/paypal/cancel", authenticate, authorizeBuyer, cartController.paypalCancel);

module.exports = router;
