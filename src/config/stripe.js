
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
console.log("Stripe API Key:", process.env.STRIPE_SECRET_KEY ? "Loaded" : "Missing");


module.exports = stripe;