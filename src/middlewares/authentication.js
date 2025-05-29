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

const authorizeAdmin = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Ensure that the user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token", error: error.message });
  }
};

const firebaseAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    const user = await Buyer.findOne({ firebaseUID: uid }) || await Seller.findOne({ firebaseUID: uid });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Middleware Firebase Auth Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


module.exports = { authenticate, authorizeSeller, authorizeBuyer, authorizeAdmin, firebaseAuthMiddleware };
