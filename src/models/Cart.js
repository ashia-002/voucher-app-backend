const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", required: true },
  priceOptionId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Store selected price option
  storeName: String,
  location: String,
  category: String,
  title: String,
  description: String,
  expiryDate: Date,
  priceOption: {
    actualPrice: Number,
    salePrice: Number,
    title: String,
  },
  conversionRate: Number,
});

module.exports = mongoose.model("Cart", CartSchema);
