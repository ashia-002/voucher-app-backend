const mongoose = require("mongoose");

const BuyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, default: "buyer" },
  profileImage: { type: String, default: "" }, // Stores profile image URL
  createdAt: { type: Date, default: Date.now }, // Timestamp when user is created
  purchasedVouchers: [
    {
      voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher" },
      purchasedAt: { type: Date, default: Date.now }, // Timestamp of purchase
    }
  ],
  balance: { type: Number, default: 0 }, // Stores reward points/money
});

module.exports = mongoose.model("Buyer", BuyerSchema);
