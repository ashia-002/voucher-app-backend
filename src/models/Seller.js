const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "seller" },
  profileImage: { 
    data: Buffer, 
    contentType: { type: String, default: "image/png" }, 
    default: { data: Buffer.alloc(0) } 
  },
  storeName: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, default: "" },
  resetPasswordToken: { type: String },
  resetPasswordTokenExpiration: { type: Date },
  isVerified: {
    type: Boolean,
    default: false, // Set default to false to indicate not verified
  },
});

module.exports = mongoose.model("Seller", SellerSchema);
