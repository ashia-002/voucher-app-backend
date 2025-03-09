const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true,
    trim: true
  },
  adminEmail: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  adminPassword: {
    type: String,
    required: true,
  },
  clients: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true }
    }
  ],
  customers: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true }
    }
  ]
});

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("adminPassword")) return next();
  this.adminPassword = await bcrypt.hash(this.adminPassword, 10);
  next();
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
