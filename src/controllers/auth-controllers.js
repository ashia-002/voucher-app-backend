const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require('dotenv').config();

const register = async (req, res) => {
  const { name, email, password, phoneNumber, role, storeName, location, description } = req.body;

  try {
    let user;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "buyer") {
      user = new Buyer({ name, email, password: hashedPassword, phoneNumber });
    } else if (role === "seller") {
      user = new Seller({ name, email, password: hashedPassword, storeName, location, description });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    await user.save();
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    console.log("Login Request Received:", { email, role });

    let user;
    if (role === "buyer") {
      user = await Buyer.findOne({ email });
    } else if (role === "seller") {
      user = await Seller.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password does not match!");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user });

  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

//?Google Authentication
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
        let user = await Buyer.findOne({email}) || await Seller.findOne({email});

        if(!user){
          user = new Buyer(
            {
              name: profile.displayName,
              email,
              password: "",
            }
          );
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

//Google Login Route Handler
const googleLogin = passport.authenticate("google", {scope: ["profile", "email"]});

const googleCallback = (req, res) => {
  passport.authenticate("google", (err, user)=> {
    if(err || !user){
      return res.redirect("/login");
    }

    const role = user.storeName ? "seller" : "buyer";
    const token = jwt.sign({id: user._id, role}, process.env.JWT_SECRET, {expiresIn: "1d"});

    res.redirect(`your-frontend-app://google-auth-success?token=${token}`);
  })(req, res);
};

module.exports = { register, login, googleLogin, googleCallback };
