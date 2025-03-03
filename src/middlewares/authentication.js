const jwt = require("jsonwebtoken");
const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");

// Middleware to authenticate users (both Buyer & Seller)
const authenticate = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No token provided" });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded;

    // Identify if the user is a Buyer or Seller
    let user;
    if (decoded.role === "buyer") {
      user = await Buyer.findById(decoded.id);
    } else if (decoded.role === "seller") {
      user = await Seller.findById(decoded.id);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token", error: error.message });
  }
};

// Middleware to authorize only Sellers
const authorizeSeller = (req, res, next) => {
  if (req.user.role !== "seller") {
    return res.status(403).json({ message: "Access Denied: Sellers only" });
  }
  next();
};

// Middleware to authorize only Buyers
const authorizeBuyer = (req, res, next) => {
  if (req.user.role !== "buyer") {
    return res.status(403).json({ message: "Access Denied: Buyers only" });
  }
  next();
};

module.exports = { authenticate, authorizeSeller, authorizeBuyer };
