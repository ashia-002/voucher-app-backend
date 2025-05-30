const admin = require("../config/firebase");
const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");
require("dotenv").config();

// Register a new user (Buyer or Seller)
// const register = async (req, res) => {
//   const { name, email, password, phoneNumber, role, storeName, location, description } = req.body;

//   try {
//     // Find existing user in both collections
//     const existingBuyer = await Buyer.findOne({ email });
//     const existingSeller = await Seller.findOne({ email });

//     // Prevent duplicate role registration
//     if (role === "buyer" && existingBuyer) {
//       return res.status(400).json({ message: "This email is already registered as a buyer." });
//     }
//     if (role === "seller" && existingSeller) {
//       return res.status(400).json({ message: "This email is already registered as a seller." });
//     }

//     // If the user exists as a different role, allow registration
//     const hashedPassword = await bcrypt.hash(password, 10);
//     let user;

//     if (role === "buyer" && existingSeller) {
//       user = new Buyer({ name, email, password: hashedPassword, phoneNumber, isVerified: false });
//     } else if (role === "seller" && existingBuyer) {
//       user = new Seller({ name, email, password: hashedPassword, storeName, location, description, isVerified: false });
//     } else if (role === "buyer") {
//       user = new Buyer({ name, email, password: hashedPassword, phoneNumber, isVerified: false });
//     } else if (role === "seller") {
//       user = new Seller({ name, email, password: hashedPassword, storeName, location, description, isVerified: false });
//     } else {
//       return res.status(400).json({ message: "Invalid role" });
//     }

//     await user.save();

//     // Send email verification
//     const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL,
//         pass: "vdqg dlda bkmt amoi", // Use environment variable
//       },
//     });

//     const mailOptions = {
//       from: process.env.EMAIL,
//       to: user.email,
//       subject: "Email Verification",
//       html: `
//         <h1>Welcome to Our Platform!</h1>
//         <p>Please verify your email address by clicking the link below:</p>
//         <a href="http://localhost:3000/api/auth/verify-email?token=${token}">Verify Email</a>
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(201).json({ message: "User registered successfully. Please check your email for verification." });

//   } catch (error) {
//     console.error(error);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "Server Error", message: error.message });
//     }
//   }
// };

const register = async (req, res) => {
  const { name, email, password, phoneNumber, role, storeName, location, description } = req.body;

  try {
    // Check if email already exists for any role (buyer or seller)
    const existingUserB = await Buyer.findOne({ email })
    const existingUserS = await Seller.findOne({ email });
    
    if (existingUserB && existingUserS) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    if (role === "buyer") {
      user = new Buyer({ name, email, password: hashedPassword, phoneNumber, isVerified: false });
    } else if (role === "seller") {
      user = new Seller({ name, email, password: hashedPassword, storeName, location, description, isVerified: false });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Save the user as "pending" (not verified)
    await user.save();

    // Send email verification link
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: "vdqg dlda bkmt amoi",
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Email Verification",
      html: `
        <h1>Welcome to Our Platform!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="https://voucher-app-backend.vercel.app/api/auth/verify-email?token=${token}">Verify Email</a>`
      ,
    };

    // Send email asynchronously
    await transporter.sendMail(mailOptions);

    // Send the response after email has been sent
    res.status(201).json({ message: "User registered successfully. Please check your email for verification." });

  } catch (error) {
    console.error(error); // Log the error for debugging
    if (!res.headersSent) {
      res.status(500).json({ error: "Server Error", message: error.message });
    }
  }
};

// Login function
const login = async (req, res) => {
  const { email, password, role, fmcToken } = req.body;

  try {
    let user;
    if (role === "buyer") {
      user = await Buyer.findOne({ email });
    } else if (role === "seller") {
      user = await Seller.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email first" });
    }

    // ✅ Save FCM token to user
    if (fmcToken) {
      user.fcmToken = fmcToken;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Google Authentication
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let buyer = await Buyer.findOne({ email });
        let seller = await Seller.findOne({ email });

        if (buyer) {
          const token = jwt.sign({ id: buyer._id, role: "buyer" }, process.env.JWT_SECRET, { expiresIn: "7d" });
          return done(null, { success: true, message: "Buyer login successful", token, user: buyer });
        }

        if (seller) {
          const token = jwt.sign({ id: seller._id, role: "seller" }, process.env.JWT_SECRET, { expiresIn: "7d" });
          return done(null, { success: true, message: "Seller login successful", token, user: seller });
        }

        // Create a new buyer if not found
        if (!buyer) {
          buyer = new Buyer({
            name: profile.displayName,
            email,
            password: " ",  // Empty password
            phoneNumber: "000000000", // Default phone number
          });
          await buyer.save();
        }

        const token = jwt.sign({ id: buyer._id, role: "buyer" }, process.env.JWT_SECRET, { expiresIn: "7d" });

        return done(null, {
          success: true,
          message: "Buyer account created and logged in.",
          token,
          user: buyer,
        });

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Google Login Route Handler
const googleLogin = passport.authenticate("google", { scope: ["profile", "email"] });

const googleCallback = (req, res) => {
  passport.authenticate("google", (err, result) => {
    if (err || !result) {
      return res.status(400).json({
        success: false,
        message: "Authentication failed",
        error: err || "User not found",
      });
    }

    const { token, user } = result;
    res.redirect(`your-frontend-app://google-auth-success?token=${token}`);
  })(req, res);
};

// Logout function
const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.status(200).json({ msg: "Logout successful" });
};

// Verify email (called after clicking the verification link)
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('Decoded Token:', decoded);

    // Try to find user in both Buyer and Seller models
    let buyerUser = await Buyer.findOne({ email: decoded.email });
    let sellerUser = await Seller.findOne({ email: decoded.email });

    if (!buyerUser && !sellerUser) {
      return res.status(404).json({ message: "User not found in both Buyer and Seller models" });
    }

    // Check if already verified in both models
    if ((buyerUser && buyerUser.isVerified) && (sellerUser && sellerUser.isVerified)) {
      return res.status(200).json({
        message: "Email already verified in both models",
        suggestion: "You can now login with your credentials"
      });
    }

    // Update isVerified in Buyer model if present
    if (buyerUser && !buyerUser.isVerified) {
      buyerUser.isVerified = true;
      await buyerUser.save();
      console.log('Buyer User Updated:', buyerUser.email, 'Verified:', buyerUser.isVerified);
    }

    // Update isVerified in Seller model if present
    if (sellerUser && !sellerUser.isVerified) {
      sellerUser.isVerified = true;
      await sellerUser.save();
      console.log('Seller User Updated:', sellerUser.email, 'Verified:', sellerUser.isVerified);
    }

    // Response if both were updated successfully
    res.status(200).json({
      message: "Email verified successfully in all applicable models",
      email: decoded.email
    });

  } catch (error) {
    console.error('Verification Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: "Verification link has expired" });
    }
    
    res.status(400).json({ 
      message: "Invalid verification token",
      error: error.message 
    });
  }
};



// Password reset request
// const requestPasswordReset = async (req, res) => {
//   const { email } = req.body;

//   try {
//     let user = await Buyer.findOne({ email }) || await Seller.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
//     user.resetPasswordToken = resetPasswordToken;
//     user.resetPasswordExpires = Date.now() + 6 * 60 * 60 * 1000; // 6 hours in milliseconds

//     await user.save();

//     const resetLink = `https://voucher-app-backend.vercel.app/api/auth/reset-password?token=${resetToken}`;

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL,
//         pass: "vdqg dlda bkmt amoi",
//       },
//     });

//     const mailOptions = {
//       from: process.env.EMAIL,
//       to: user.email,
//       subject: "Password Reset Request",
//       html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: "Password reset link sent to your email" });

//   } catch (error) {
//     res.status(500).json({ error: "Server Error" });
//   }
// };

// const forgotPassword = async (req, res) => {
//   const { email, role } = req.body;

//   try {
//     let user;

//     if (role === "buyer") user = await Buyer.findOne({ email });
//     else if (role === "seller") user = await Seller.findOne({ email });
//     else return res.status(400).json({ message: "Invalid role" });

//     if (!user) return res.status(404).json({ message: "User not found" });
//     if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });

//     const token = crypto.randomBytes(32).toString("hex");

//     user.resetPasswordToken = token;
//     user.resetPasswordTokenExpiration = Date.now() + 15 * 60 * 1000; // 15 minutes
//     await user.save();

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const resetLink = `yourapp://reset-password/${token}?role=${role}`;

//     const mailOptions = {
//       from: process.env.EMAIL,
//       to: email,
//       subject: "Password Reset Request",
//       html: `
//         <p>You requested a password reset.</p>
//         <p>Click the link below to reset your password:</p>
//         <a href="${resetLink}">${resetLink}</a>
//         <p>This link will expire in 15 minutes.</p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: "Reset link sent to your email" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

const forgotPassword = async (req, res) => {
  const { email, role } = req.body;

  try {
    let user;
    if (role === "buyer") user = await Buyer.findOne({ email });
    else if (role === "seller") user = await Seller.findOne({ email });
    else return res.status(400).json({ message: "Invalid role" });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiration = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset it:</p>
        <a href="yourapp://reset-password/${resetToken}?role=${role}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    let user = await Buyer.findOne({ resetPasswordToken }) || await Seller.findOne({ resetPasswordToken });

    if (!user || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });

  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

const firebaseAuth = async (req, res) => {
  try {
    const { idToken, role = "buyer", fcmToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user;
    if (role === "buyer") {
      user = await Buyer.findOne({ email });
    } else if (role === "seller") {
      user = await Seller.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      if (role === "buyer") {
        user = new Buyer({
          name: name || "User",
          email,
          password: randomPassword,
          phoneNumber: decodedToken.phone_number || "",
          firebaseUID: uid,
          profilePicture: picture || "",
          isVerified: true
        });
      } else {
        user = new Seller({
          name: name || "User",
          email,
          password: randomPassword,
          storeName: name || "Store",
          location: "",
          description: "",
          firebaseUID: uid,
          profilePicture: picture || "",
          isVerified: true
        });
      }
      await user.save();
    } else {
      if (!user.firebaseUID) {
        user.firebaseUID = uid;
        user.profilePicture = picture || user.profilePicture;
        await user.save();
      }
    }

    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Authentication successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};


module.exports = { register, login, googleLogin, googleCallback, logout, verifyEmail, forgotPassword, resetPassword, firebaseAuth };
