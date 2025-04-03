const stripe = require("../config/stripe");
const Seller = require("../models/Seller");
const SUBSCRIPTION_PLAN = require("../config/subscriptionPlan");
const { sendNotification } = require("./notification");

const processSubscriptionPayment = async (req, res) => {
  try {
      const { sellerId, plan } = req.body;

      // Validate seller
      const seller = await Seller.findById(sellerId);
      if (!seller) {
          return res.status(404).json({ success: false, message: "Seller not found" });
      }

      // Validate plan
      if (!SUBSCRIPTION_PLAN[plan]) {
          return res.status(400).json({ success: false, message: "Invalid subscription plan" });
      }

      const planDetails = SUBSCRIPTION_PLAN[plan];

      // 🔹 Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
          amount: planDetails.price * 100, // Convert to cents
          currency: "gbp",
          metadata: { sellerId, plan },
      });

      res.json({ success: true, clientSecret: paymentIntent.client_secret });

  } catch (error) {
      console.error("❌ Payment Error:", error);
      res.status(500).json({ 
          success: false, 
          message: "Payment processing failed", 
          error: error.message 
      });
  }
};


const handlePaymentSuccess = async (req, res) => {
    try {
        const {sellerId, plan} = req.body;
        const planDetails = SUBSCRIPTION_PLAN[plan];

        const seller = await Seller.findByIdAndUpdate(sellerId, {
            "subscription.plan": plan,
            "subscription.voucherLimit": planDetails.voucherLimit,
            "subscription.startDate": new Date(),
            "subscription.expiryDate": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month from now
        }, {new: true});

        if(!seller) return res.status(404).json({message: "Seller not found"});

        // // 🔹 Notify Admin
        // await sendNotification(
        //   process.env.ADMIN_FCM_TOKEN,
        //   "New Subscription!",
        //   `${seller.name} subscribed to the ${plan} plan (£${planDetails.price})`
        // );

        //Notify Seller
        await sendNotification(
            seller.fcmToken,
            "Subscription Confirmed!",
            `You are now on the ${plan} plan. You can add ${planDetails.voucherLimit} vouchers this month.`
        );

        res.json({message: "Subscription activated", seller});
    } catch (error) {
        console.error("Subscription Error:", error);
        res.status(500).json({ message: "Subscription activation failed", error: error.message });
    }
}

module.exports = {processSubscriptionPayment, handlePaymentSuccess};
  