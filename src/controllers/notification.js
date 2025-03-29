const admin = require("../config/firebase");
const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");

/**
 * Send a push notification using Firebase Cloud Messaging (FCM)
 */
const sendNotification = async (fcmToken, title, body) => {
    if (!fcmToken) return console.error("FCM Token is missing");
  
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
    };
  
    try {
      const response = await admin.messaging().send(message);
      console.log("Notification sent successfully:", response);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };
  
  /**
   * Notify seller when a buyer purchases a voucher
   */
  const notifySellerOnVoucherPurchase = async (sellerId, voucherName, buyerName) => {
    const seller = await Seller.findById(sellerId);
    if (!seller || !seller.fcmToken) return;
  
    const title = "Voucher Purchased!";
    const body = `${buyerName} bought your voucher: ${voucherName}. Check your dashboard!`;
  
    await sendNotification(seller.fcmToken, title, body);
  };
  
  /**
   * Notify all buyers when a seller adds a new voucher
   */
  const notifyBuyersOnNewVoucher = async (voucherName, sellerName) => {
    const buyers = await Buyer.find({ fcmToken: { $exists: true, $ne: null } });
  
    buyers.forEach(async (buyer) => {
      const title = "New Voucher Available!";
      const body = `${sellerName} just added a new voucher: ${voucherName}. Grab it now!`;
  
      await sendNotification(buyer.fcmToken, title, body);
    });
  };
  
  module.exports = { notifySellerOnVoucherPurchase, notifyBuyersOnNewVoucher, sendNotification };
  