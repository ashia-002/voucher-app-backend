const mongoose = require("mongoose");

const BuyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, default: "buyer" },
  profileImage: { 
    data: Buffer, 
    contentType: { type: String, default: "image/png" }, 
    default: { data: Buffer.alloc(0) } 
  }, // Stores profile image as Buffer
  firebaseUID: { type: String, sparse: true, index: true },
  profilePicture: { type: String, default: "" }, // URL from Firebase
  createdAt: { type: Date, default: Date.now }, // Timestamp when user is created
  purchasedVouchers: [
    {
      voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher" },
      purchasedAt: { type: Date, default: Date.now }, // Timestamp of purchase
    }
  ],
  balance: { type: Number, default: 0 }, // Stores reward points/money
  resetPasswordToken: { type: String },
  resetPasswordTokenExpiration: { type: Date },
  isVerified: {
    type: Boolean,
    default: false, // Set default to false to indicate not verified
  },
  fcmToken: { type: String },
});

module.exports = mongoose.model("Buyer", BuyerSchema);
