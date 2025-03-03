const express = require('express');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const voucherRoutes = require('./src/routes/voucherRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const mongo = "mongodb+srv://app-backend:app-backend@cluster0.ssuxf.mongodb.net/";

//to parse json
app.use(express.json());

//database connection
//connectDB();
mongoose.connect(mongo)
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