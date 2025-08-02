# Voucher App Backend

A robust and scalable backend system built with **Node.js**, **Express.js**, and **MongoDB**, designed to power a Flutter-based mobile voucher application. This backend handles both Buyer and Seller operations, coupon generation, usage tracking, authentication, and more.

## 🔧 Overview

This backend system supports the complete lifecycle of vouchers for a mobile e-commerce platform. It provides API routes to manage Buyers and Sellers, issue and validate vouchers, track units sold and revenue, and more.

Built for a Flutter-based mobile app, this backend powers real-time voucher transactions with support for secure authentication, email verification, and Google login.


## 👥 Collaboration

This backend was developed collaboratively by **Ashia Sultana** and **Tanmoy**, tailored for integration with a **Flutter frontend application**.

---

## 🚀 Features

- ✅ **Authentication**
  - Buyer & Seller Registration and Login
  - Email verification via Nodemailer
  - Google OAuth support
  - Password reset with token-based validation

- ✅ **Voucher Management**
  - Add, update, delete vouchers (by seller)
  - Track units sold and revenue
  - Support for multiple price options per voucher
  - Voucher status: active or expired
  - Unique coupon code generation
  - Mark voucher as used by providing buyer details and coupon code

- ✅ **Usage Tracking**
  - Tracks whether a voucher was used, when, and by whom

- ✅ **Role Separation**
  - Buyer and Seller are treated as different roles with separate collections

---

## 🛠️ Technology Stack

| Layer        | Tech                     |
|--------------|--------------------------|
| Backend      | Node.js, Express.js      |
| Database     | MongoDB + Mongoose       |
| Email        | Nodemailer               |
| Auth         | Passport.js, JWT, Firebase |
| Date Handling| Date-fns / JavaScript    |

---

## 📦 Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/voucher-app-backend.git
   cd voucher-app-backend
   ```


## 📲 Built For
    This backend system is specifically built for a Flutter mobile app that allows users to explore, purchase, and redeem vouchers for experiences and excursions.