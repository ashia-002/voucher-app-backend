const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const voucherRoutes = require('./src/routes/voucherRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;


// ✅ Configure CORS for all origins
app.use(
    cors({
      origin: "*", // Allows requests from ANY origin (⚠️ For development only)
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  
  // OR - Allow Specific Origins (Recommended for production)
  const allowedOrigins = [
    "http://localhost:3000",  // If testing locally
    "https://your-flutter-app.web.app", // Your deployed Flutter web app (if applicable)
    "https://your-frontend-domain.com", // Your actual frontend domain
  ];
  
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true, // Allow cookies & authentication headers
    })
  );
  

//to parse json
app.use(express.json());

//database connection
//connectDB();
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("mongodb is connected"))
.catch((e)=> console.log(e));

//routes configuration
app.use("/api/auth", authRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/cart", cartRoutes);

//global error handler
app.use((err, req, res, next)=> {
    console.log(err.stack);
    res.status(500).json({
        success : false,
        message : 'Something went wrong'
    })
})

app.listen(PORT, ()=> {
    console.log(`Server is running on ${PORT}`);
    console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Loaded ✅" : "Missing ❌"); 
});