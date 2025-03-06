const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true }, // Linked to Buyer
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true }, // Linked to Seller
  vouchers: [
    {
      voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", required: true }, // Link to Voucher model
      status: { type: String, enum: ["Active", "Expired"], default: "Active" },
      expiryDate: Date,
      purchaseDate: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Order", orderSchema);
