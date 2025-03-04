const Voucher = require("../models/Voucher");
const Seller = require("../models/Seller");

// Add Voucher (Seller)
exports.addVoucher = async (req, res) => {
  try {
    const { category, title, description, expiryDate, priceOptions, conversionRate } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Seller ID is missing" });
    }

    // ✅ Fetch store details from Seller model
    const seller = await Seller.findById(req.user.id).select("storeName location description");

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // ✅ Create a new voucher with the store details from Seller model
    const voucher = new Voucher({
      sellerId: req.user.id,
      storeName: seller.storeName, // Automatically fetched from Seller model
      location: seller.location,   // Automatically fetched from Seller model
      category,
      title,
      description,
      expiryDate: new Date(expiryDate), // Ensure proper Date format
      priceOptions,
      conversionRate,
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

    res.json({ vouchers });
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


// ✅ Get Store Cards (Buyer)
exports.getStoreCards = async (req, res) => {
  try {
    const stores = await Seller.find().select("storeName location");

    const storeData = await Promise.all(
      stores.map(async (store) => {
        const bestVoucher = await Voucher.findOne({ sellerId: store._id }).sort({ unitsSold: -1 });
        return {
          storeName: store.storeName,
          location: store.location,
          bestPrice: bestVoucher ? bestVoucher.priceOptions[0].salePrice : "N/A",
          storeId: store._id,
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
    const store = await Seller.findById(storeId).select("storeName location description");

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Fetch all active vouchers for the store
    const vouchers = await Voucher.find({
      sellerId: storeId, // Ensure this matches the sellerId field in Voucher model
      expiryDate: { $gte: new Date() } // Only fetch active vouchers
    });

    res.json({ store, vouchers });
  } catch (error) {
    console.error("Error fetching store details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


