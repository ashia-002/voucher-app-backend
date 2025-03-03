const mongoose = require("mongoose");

const VoucherSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    storeName: String,
    location: String,
    category: { type: String, enum: ["Experience", "Excursion"], required: true },
    title: String,
    description: String,
    expiryDate: { type: Date, required: true },
    priceOptions: [
      {
        actualPrice: Number,  // Store as Number
        salePrice: Number,    // Store as Number
        title: String,
      }
    ],
    conversionRate: Number,
    unitsSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  { toJSON: { virtuals: true } }
);

// Virtual field for days remaining & voucher status
VoucherSchema.virtual("daysRemaining").get(function () {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  return Math.max(0, Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)));
});

VoucherSchema.virtual("voucherStatus").get(function () {
  return this.daysRemaining > 0 ? "Active" : "Expired";
});

// Format price for display (Optional)
VoucherSchema.virtual("formattedPriceOptions").get(function () {
  return this.priceOptions.map(option => ({
    ...option,
    actualPrice: `$${option.actualPrice.toFixed(2)}`, // Convert to string with 2 decimals
    salePrice: `$${option.salePrice.toFixed(2)}`,   // Convert to string with 2 decimals
  }));
});

module.exports = mongoose.model("Voucher", VoucherSchema);
