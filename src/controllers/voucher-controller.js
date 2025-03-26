const Voucher = require("../models/Voucher");
const Seller = require("../models/Seller");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// Add Voucher (Seller)
exports.addVoucher = async (req, res) => {
  try {
    const { category, title, description, expiryDate, priceOptions, couponCode } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Seller ID is missing" });
    }

    // ✅ Fetch store details from Seller model
    const seller = await Seller.findById(req.user.id).select("storeName location description");

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // ✅ Check if coupon code already exists (to avoid duplicates)
    const existingVoucher = await Voucher.findOne({ couponCode });
    if (existingVoucher) {
      return res.status(400).json({ message: "Coupon code already exists. Please choose another." });
    }

    // ✅ Create a new voucher without conversionRate
    const voucher = new Voucher({
      sellerId: req.user.id,
      storeName: seller.storeName, 
      location: seller.location,   
      category,
      title,
      description,
      expiryDate: new Date(expiryDate),
      priceOptions,
      couponCode,  // ✅ Store the provided coupon code
    });

    await voucher.save();

    res.status(201).json({
      message: "Voucher added successfully",
      voucher,
    });

  } catch (error) {
    console.error("Error adding voucher:", error);
    res.status(500).json({ message: "Error adding voucher", error: error.message });
  }
};



// Get All Active Vouchers (For Buyers)
exports.getAllActiveVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      expiryDate: { $gte: new Date() } // Fetch only active vouchers
    });

    const enrichedVouchers = await Promise.all(
      vouchers.map(async (voucher) => {
        const seller = await Seller.findById(voucher.sellerId).select("profileImage");

        let profileImage = null;
        if (seller && seller.profileImage && seller.profileImage.data) {
          sellerProfileImage = typeof seller.profileImage.data === "string"
            ? `data:${seller.profileImage.contentType};base64,${seller.profileImage.data}`
            : `data:${seller.profileImage.contentType};base64,${seller.profileImage.data.toString("base64")}`;
        }

        return {
          ...voucher.toObject(),
          profileImage,
        };
      })
    );

    res.json({ vouchers: enrichedVouchers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching active vouchers", error });
  }
};



// Get All Active Vouchers for a perticular seller
exports.getSellerVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      sellerId: req.user.id,
      expiryDate: { $gte: new Date() } // Only fetch active vouchers
    });

    res.json({ vouchers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seller vouchers", error });
  }
};


// Get Seller's Expired Vouchers
exports.getExpiredVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      sellerId: req.user.id,
      expiryDate: { $lt: new Date() }
    });

    res.json({ expiredVouchers: vouchers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching expired vouchers", error });
  }
};


// Update Voucher (Seller)
exports.updateVoucher = async (req, res) => {
  try {
    if (req.user.role !== "seller") return res.status(403).json({ message: "Unauthorized" });

    const { voucherId } = req.params;
    const updateData = req.body;

    const voucher = await Voucher.findOneAndUpdate(
      { _id: voucherId, sellerId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!voucher) return res.status(404).json({ message: "Voucher not found" });

    res.json({ message: "Voucher updated successfully", voucher });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ✅ Delete Voucher (Seller)
exports.deleteVoucher = async (req, res) => {
  try {
    if (req.user.role !== "seller") return res.status(403).json({ message: "Unauthorized" });

    const { voucherId } = req.params;
    const voucher = await Voucher.findOneAndDelete({ _id: voucherId, sellerId: req.user.id });

    if (!voucher) return res.status(404).json({ message: "Voucher not found" });

    res.json({ message: "Voucher deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Voucher Stats (Seller)
exports.getSellerVoucherStats = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Seller ID is missing" });
    }

    const sellerId = new mongoose.Types.ObjectId(req.user.id); // Convert to ObjectId explicitly

    // Fetch total vouchers listed by the seller
    const totalVouchers = await Voucher.countDocuments({ sellerId });

    // Fetch expired vouchers
    const expiredVouchers = await Voucher.countDocuments({
      sellerId,
      expiryDate: { $lt: new Date() },
    });

    // Fetch total vouchers sold from Order collection
    const totalVouchersSold = await Order.aggregate([
      { $match: { sellerId } }, // Match orders for this seller
      { $unwind: "$vouchers" }, // Unwind vouchers array
      {
        $group: {
          _id: null,
          totalSold: { $sum: 1 }, // Count each voucher sold
        },
      },
    ]);

    // Fetch total revenue
    const totalRevenue = await Order.aggregate([
      { $match: { sellerId } }, 
      { 
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Count unique customers
    const uniqueCustomers = await Order.distinct("buyerId", { sellerId });

    res.json({
      sellerId,
      totalCustomers: uniqueCustomers.length,  // Added totalCustomers
      totalVouchers,
      expiredVouchers,
      totalVouchersSold: totalVouchersSold.length > 0 ? totalVouchersSold[0].totalSold : 0,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0,
    });

  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// ✅ Get Store Cards (Buyer)
exports.getStoreCards = async (req, res) => {
  try {
    const stores = await Seller.find().select("storeName location profileImage");

    const storeData = await Promise.all(
      stores.map(async (store) => {
        const bestVoucher = await Voucher.findOne({ sellerId: store._id }).sort({ unitsSold: -1 });

        // Ensure profileImage is properly handled
        let profileImage = null;
        if (store.profileImage && store.profileImage.data && store.profileImage.data.length > 0) {
          profileImage = `data:${store.profileImage.contentType};base64,${store.profileImage.data.toString("base64")}`;
        }

        return {
          storeName: store.storeName,
          location: store.location,
          bestPrice: bestVoucher ? bestVoucher.priceOptions[0].salePrice : "N/A",
          storeId: store._id,
          //profileImage: store.profileImage ? `data:${store.profileImage.contentType};base64,${store.profileImage.data.toString('base64')}` : null,
          profileImage,
        };
      })
    );

    res.json(storeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ Get Store Details & Vouchers (Buyer)
exports.getStoreDetails = async (req, res) => {
  try {
    const { storeId } = req.params; // storeId is actually the sellerId in your case

    // Fetch store details from the Seller collection
    const store = await Seller.findById(storeId).select("storeName location description profileImage");

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Ensure profileImage is properly handled
    let profileImage = null;
    if (store.profileImage && store.profileImage.data && store.profileImage.data.length > 0) {
      profileImage = `data:${store.profileImage.contentType};base64,${store.profileImage.data.toString("base64")}`;
    }

    // Fetch all active vouchers for the store
    const vouchers = await Voucher.find({
      sellerId: storeId, // Ensure this matches the sellerId field in Voucher model
      expiryDate: { $gte: new Date() } // Only fetch active vouchers
    });

    res.json({ 
      store: {
        storeName: store.storeName,
        location: store.location,
        description: store.description,
        profileImage, // Include profile image in response
      },
      vouchers 
    });
  } catch (error) {
    console.error("Error fetching store details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


