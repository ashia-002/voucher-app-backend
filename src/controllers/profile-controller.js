const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");

/**
 * View Profile (Buyer or Seller)
 */
const viewProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let user;
    if (role === "buyer") {
      user = await Buyer.findById(userId).select("-password"); // Exclude password
    } else if (role === "seller") {
      user = await Seller.findById(userId).select("-password");
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

     // If the user has a profile image, convert the binary data to base64
     if (user.profileImage && user.profileImage.data) {
        user.profileImage.data = user.profileImage.data.toString('base64');
      }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update Profile (Buyer or Seller)
 */
const updateProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const { name, email, phoneNumber, storeName, location, description } = req.body;
  
      let updateData = { name, email };
  
      // If an image is uploaded, add it to updateData
      if (req.file) {
        updateData.profileImage = {
          data: req.file.buffer, // Store image in binary format
          contentType: req.file.mimetype,
        };
      }
  
      let user;
      if (role === "buyer") {
        updateData.phoneNumber = phoneNumber;
        user = await Buyer.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
      } else if (role === "seller") {
        updateData.storeName = storeName;
        updateData.location = location;
        updateData.description = description;
        user = await Seller.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
      } else {
        return res.status(400).json({ message: "Invalid user role" });
      }
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.json({ success: true, message: "Profile updated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

/**
 * Change Password (Buyer or Seller)
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    let user;
    if (role === "buyer") {
      user = await Buyer.findById(userId);
    } else if (role === "seller") {
      user = await Seller.findById(userId);
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Save updated password
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { viewProfile, updateProfile, changePassword };
