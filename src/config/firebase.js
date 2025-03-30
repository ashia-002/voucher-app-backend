const admin = require('firebase-admin');
require('dotenv').config();
//const serviceAccount = require("./firebase-service-account.json");

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;