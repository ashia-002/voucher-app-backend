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
  firebaseUID: { type: String, sparse: true, index: true },
  profilePicture: { type: String, default: "" }, // URL from Firebase
  storeName: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, default: "" },
  resetPasswordToken: { type: String },
  resetPasswordTokenExpiration: { type: Date },
  isVerified: {
    type: Boolean,
    default: false, // Set default to false to indicate not verified
  },
  fcmToken: { type: String },
  subscription: {
    plan: { type: String, enum: ["free", "basic", "standard", "premium"], default: "free" },
    voucherLimit: { type: Number, default: 10 },
    startDate: Date,
    expiryDate: Date,
  }
});

module.exports = mongoose.model("Seller", SellerSchema);
