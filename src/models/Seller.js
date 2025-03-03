const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "seller" },
  storeName: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, default: "" },
});

module.exports = mongoose.model("Seller", SellerSchema);
