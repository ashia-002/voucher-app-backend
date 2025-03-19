const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");
const Order = require("../models/Order");
const Voucher = require("../models/Voucher");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mongoose = require("mongoose");

const login = async (req, res) => {
    const { email, password } = req.body;

  // Check if email matches the fixed admin email
  if (email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Compare password (plaintext comparison since it's fixed)
  const isPasswordValid = password === process.env.ADMIN_PASSWORD;
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Generate JWT token with role: "admin"
  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "3h" });

  res.status(200).json({ message: "Login successful", token });
};

//get admin customers
const getAdminCustomers = async (req, res) => {
    try {
      // Assuming the admin is always associated with a fixed sellerId
      const adminSellerId = process.env.ADMIN_SELLER_ID; // Admin's seller ID (can be stored in .env)
      
      // Find all orders where the seller is the admin
      const orders = await Order.find({ sellerId: adminSellerId }).populate("buyerId", "name email");
  
      // Group by customer (buyer)
      const customers = {};
  
      // Loop through orders to organize customer data
      orders.forEach(order => {
        const buyer = order.buyerId;
        if (!customers[buyer._id]) {
          customers[buyer._id] = {
            name: buyer.name,
            email: buyer.email,
            totalBought: 0,
            vouchers: []
          };
        }
        customers[buyer._id].totalBought += order.vouchers.length;
        customers[buyer._id].vouchers.push(...order.vouchers);
      });
  
      // Return a list of customers who bought from the admin
      res.json(Object.values(customers));
  
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  const getAdminSellers = async (req, res) => {
    try {
      // Fetch all sellers
      const sellers = await Seller.find().select("name email storeName");
  
      if (!sellers || sellers.length === 0) {
        return res.status(404).json({ message: "No sellers found." });
      }
  
      // Process each seller to calculate revenue and active vouchers
      const sellerStats = await Promise.all(
        sellers.map(async (seller) => {
          const sellerId = seller._id;
  
          // Calculate total revenue from orders
          const orders = await Order.find({ sellerId }).select("totalAmount");
          const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  
          // Count active vouchers (vouchers with expiry date in the future)
          const activeVouchers = await Voucher.countDocuments({
            sellerId: sellerId,
            expiryDate: { $gte: new Date() },
          });
  
          return {
            sellerId,
            name: seller.name,
            email: seller.email,
            storeName: seller.storeName,
            totalRevenue,
            activeVouchers,
          };
        })
      );
  
      res.json(sellerStats);
    } catch (error) {
      console.error("Error fetching seller stats:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

  // Add Voucher (Admin)
  const addVoucher = async (req, res) => {
    try {
      const { category, title, description, expiryDate, priceOptions, conversionRate } = req.body;
  
      if (!req.user || req.user.role !== "admin") {
        return res.status(401).json({ message: "Unauthorized: Admin ID is missing" });
      }
  
      // Fetch admin store details (for their own vouchers)
      const seller = await Seller.findById(req.user.id).select("storeName location description");
  
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
  
      // Create a new voucher with the store details from Seller model
      const voucher = new Voucher({
        sellerId: req.user.id, // The admin's sellerId is used here
        storeName: seller.storeName,
        location: seller.location,
        category,
        title,
        description,
        expiryDate: new Date(expiryDate),
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
  // Get All Active Vouchers (Admin)
  const getAllActiveVouchers = async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(401).json({ message: "Unauthorized: Admin access required" });
      }
  
      const vouchers = await Voucher.find({
        sellerId: req.user.id, // Admin can only view their own vouchers
        expiryDate: { $gte: new Date() }
      });
  
      res.json({ vouchers });
    } catch (error) {
      res.status(500).json({ message: "Error fetching active vouchers", error });
    }
  };

  // Get All Expired Vouchers (Admin)
  const getAllExpiredVouchers = async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(401).json({ message: "Unauthorized: Admin access required" });
      }
  
      const vouchers = await Voucher.find({
        sellerId: req.user.id, // Admin can only view their own vouchers
        expiryDate: { $lt: new Date() }
      });
  
      res.json({ expiredVouchers: vouchers });
    } catch (error) {
      res.status(500).json({ message: "Error fetching expired vouchers", error });
    }
  };
  
  
  // Delete Voucher (Admin)
  const deleteVoucher = async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      const { voucherId } = req.params;
  
      // Admin can only delete their own vouchers
      const voucher = await Voucher.findOneAndDelete({ _id: voucherId, sellerId: req.user.id });
  
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
  
      res.json({ message: "Voucher deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Update Voucher (Admin)
  const updateVoucher = async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      const { voucherId } = req.params;
      const updateData = req.body;
  
      // Admin can only update their own vouchers
      const voucher = await Voucher.findOneAndUpdate(
        { _id: voucherId, sellerId: req.user.id },
        updateData,
        { new: true, runValidators: true }
      );
  
      if (!voucher) {
        return res.status(404).json({ message: "Voucher not found" });
      }
  
      res.json({ message: "Voucher updated successfully", voucher });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  //totalRevenue, totalActiveVouchers, totalSoldVouchers, totalCustomers, sellersWithVouchers
  const getAdminStats = async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      // Calculate total revenue
      const totalRevenueResult = await Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
      ]);
      const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;
  
      // Count total active vouchers
      const totalActiveVouchers = await Voucher.countDocuments({ expiryDate: { $gte: new Date() } });
  
      // Count total sold vouchers
      const totalSoldVouchersResult = await Order.aggregate([
        { $unwind: "$vouchers" }, 
        { $group: { _id: null, totalSoldVouchers: { $sum: 1 } } }
      ]);
      const totalSoldVouchers = totalSoldVouchersResult.length > 0 ? totalSoldVouchersResult[0].totalSoldVouchers : 0;
  
      // Count total unique customers
      const totalCustomers = await Order.distinct("buyerId").then((buyers) => buyers.length);
  
      // Count total sellers who have added at least one voucher
      const sellersWithVouchers = await Voucher.distinct("sellerId").then((sellers) => sellers.length);
  
      res.json({
        totalRevenue,
        totalActiveVouchers,
        totalSoldVouchers,
        totalCustomers,
        sellersWithVouchers,  // Updated this
      });
  
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  
module.exports = {login, getAdminCustomers, getAdminSellers, addVoucher, getAllActiveVouchers, getAllExpiredVouchers, deleteVoucher, updateVoucher, getAdminStats};