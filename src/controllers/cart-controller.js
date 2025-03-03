const Cart = require("../models/Cart");
const Voucher = require("../models/Voucher");
const stripe = require("../config/stripe");
const paypal = require("../config/paypal");

// 🟢 Add Voucher to Cart
//http://localhost:3000/api/cart/add
exports.addToCart = async (req, res) => {
  try {
    const { voucherId, priceOptionId } = req.body;
    const buyerId = req.user.id;

    // Check if the voucher exists
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });

    // Find the selected price option
    const selectedPriceOption = voucher.priceOptions.find(
      (option) => option._id.toString() === priceOptionId
    );

    if (!selectedPriceOption) {
      return res.status(400).json({ message: "Invalid price option selected" });
    }

    // Check if the item is already in the cart with the same price option
    let cartItem = await Cart.findOne({ buyerId, voucherId, priceOptionId });

    if (cartItem) {
      return res.status(400).json({ message: "Voucher already in cart with this price option" });
    }

    // Add to cart
    cartItem = new Cart({
      buyerId,
      voucherId,
      priceOptionId,
      storeName: voucher.storeName,
      location: voucher.location,
      category: voucher.category,
      title: voucher.title,
      description: voucher.description,
      expiryDate: voucher.expiryDate,
      priceOption: selectedPriceOption, // Store selected price option details
      conversionRate: voucher.conversionRate,
    });

    await cartItem.save();
    res.status(201).json({ message: "Voucher added to cart", cartItem });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ for Buyer
// 🟢 Get All Vouchers in Cart
//http://localhost:3000/api/cart/
exports.getCart = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const cartItems = await Cart.find({ buyerId });

    res.status(200).json({ cart: cartItems });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Remove Voucher from Cart
// 🛑 Remove Voucher from Cart(a specific voucher withpriceoption id)
//http://localhost:3000/api/cart/remove/{cartItemId}
exports.removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const buyerId = req.user.id;

    const cartItem = await Cart.findOneAndDelete({ _id: cartItemId, buyerId });

    if (!cartItem) {
      return res.status(404).json({ message: "Voucher not found in cart" });
    }

    res.status(200).json({ message: "Voucher removed from cart", cartItem });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🟡 Get Cart Summary (Total Items & Cost)
//http://localhost:3000/api/cart/summary
exports.getCartSummary = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const cartItems = await Cart.find({ buyerId });

    const totalItems = cartItems.length;
    const totalCost = cartItems.reduce((sum, item) => sum + item.priceOption.salePrice, 0);

    res.status(200).json({ totalItems, totalCost });
  } catch (error) {
    console.error("Error fetching cart summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// 🛑 Clear Cart After Purchase
//http://localhost:3000/api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Delete all items from the cart for the buyer
    await Cart.deleteMany({ buyerId });

    res.status(200).json({ message: "Cart cleared successfully after purchase" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// 🟢 Checkout with Stripe
///api/cart/checkout/stripe
exports.checkoutWithStripe = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const cartItems = await Cart.find({ buyerId });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalAmount = cartItems.reduce((total, item) => total + item.priceOption.salePrice, 0);

    // Create a Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Convert to cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: { buyerId },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🟢 Checkout with PayPal
exports.checkoutWithPayPal = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const cartItems = await Cart.find({ buyerId });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalAmount = cartItems.reduce((total, item) => total + item.priceOption.salePrice, 0);

    const createPaymentJson = {
      intent: "sale",
      payer: { payment_method: "paypal" },
      redirect_urls: {
        return_url: "http://localhost:3000/api/cart/paypal/success",
        cancel_url: "http://localhost:3000/api/cart/paypal/cancel",
      },
      transactions: [
        {
          amount: { currency: "USD", total: totalAmount.toFixed(2) },
          description: "Voucher Purchase",
        },
      ],
    };

    paypal.payment.create(createPaymentJson, (error, payment) => {
      if (error) {
        console.error("PayPal error:", error);
        return res.status(500).json({ message: "Error creating PayPal payment", error });
      } else {
        const approvalUrl = payment.links.find((link) => link.rel === "approval_url").href;
        res.status(200).json({ approvalUrl });
      }
    });
  } catch (error) {
    console.error("PayPal checkout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// 🟢 Handle PayPal Success
exports.paypalSuccess = async (req, res) => {
  const { paymentId, PayerID } = req.query;

  paypal.payment.execute(paymentId, { payer_id: PayerID }, async (error, payment) => {
    if (error) {
      return res.status(500).json({ message: "Payment execution failed", error });
    }

    // Clear the cart after successful payment
    await Cart.deleteMany({ buyerId: req.user.id });

    res.status(200).json({ message: "Payment successful, cart cleared", payment });
  });
};

// 🔴 Handle PayPal Cancellation
exports.paypalCancel = (req, res) => {
  res.status(400).json({ message: "Payment cancelled by user" });
};
