const Order = require("../models/Order");
const Voucher = require("../models/Voucher");


const getSellerCustomers = async (req, res) => {
  try {
    const sellerId = req.user._id; // Get seller's ID from JWT

    // Find all orders for this seller
    const orders = await Order.find({ sellerId }).populate("buyerId", "name email");

    // Group by buyer
    const customers = {};

    orders.forEach(order => {
      const buyer = order.buyerId;
      if (!customers[buyer._id]) {
        customers[buyer._id] = {
          name: buyer.name,
          email: buyer.email,
          totalBought: 0,
          vouchers: []
        };
      }
      customers[buyer._id].totalBought += order.vouchers.length;
      customers[buyer._id].vouchers.push(...order.vouchers);
    });

    res.json(Object.values(customers));
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//?✅ Count unique customers who purchased from the seller.
//?✅ Count total vouchers sold.
const getSellerSummary = async (req, res) => {
    try {
      const sellerId = req.user._id; // Get seller ID from JWT
  
      // Fetch all orders for this seller
      const orders = await Order.find({ sellerId });
  
      // Count unique buyers
      const uniqueBuyers = new Set(orders.map(order => order.buyerId.toString()));
  
      // Count total vouchers sold
      const totalVouchersSold = orders.reduce((sum, order) => sum + order.vouchers.length, 0);
  
      res.json({
        totalCustomers: uniqueBuyers.size,
        totalVouchersSold
      });
    } catch (error) {
      console.error("Error fetching seller summary:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

//   const getSellerRevenue = async (req, res) => {
//     try {
//         const sellerId = req.user._id; // Get seller ID from JWT
        
//         // Fetch all orders for this seller
//         const orders = await Order.find({ sellerId });

//         // Calculate total revenue using totalAmount field
//         const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

//         res.json({ totalRevenue });
//     } catch (error) {
//         console.error("Error fetching seller revenue:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

  

//?✅ Create a new order with buyerId, sellerId, and vouchers.
//?✅ Save the order in MongoDB.
const placeOrder = async (req, res) => {
  try {
    const { sellerId, vouchers } = req.body;
    const buyerId = req.user._id; // Get buyer ID from JWT

    if (!sellerId || !vouchers || vouchers.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch voucher details from the database
    const voucherIds = vouchers.map(v => v.voucherId);
    const voucherDetails = await Voucher.find({ _id: { $in: voucherIds } });

    if (voucherDetails.length !== vouchers.length) {
      return res.status(400).json({ message: "Invalid vouchers provided" });
    }

    // Calculate total amount
    let totalAmount = 0;
    const updatedVouchers = vouchers.map(v => {
      const voucherInfo = voucherDetails.find(voucher => String(voucher._id) === String(v.voucherId));

      if (!voucherInfo || !voucherInfo.priceOptions || voucherInfo.priceOptions.length === 0) {
        throw new Error(`Invalid price for voucher ID: ${v.voucherId}`);
      }

      // Get the lowest sale price or actual price
      const selectedPrice = voucherInfo.priceOptions.reduce((min, option) => {
        return option.salePrice && option.salePrice > 0 ? Math.min(min, option.salePrice) : min;
      }, voucherInfo.priceOptions[0].actualPrice);

      if (typeof selectedPrice !== "number" || isNaN(selectedPrice)) {
        throw new Error(`Invalid price value for voucher ID: ${v.voucherId}`);
      }

      totalAmount += selectedPrice; // Sum up the total price
      return { ...v, price: selectedPrice }; // Add price to voucher details
    });

    // Create new order with total amount
    const newOrder = new Order({
      buyerId,
      sellerId,
      vouchers: updatedVouchers,
      totalAmount, // Ensure this is a valid number
    });

    await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: newOrder });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getBuyerOrders = async (req, res) => {
    try {
      const buyerId = req.user._id;
  
      const orders = await Order.find({ buyerId })
        .populate("vouchers.voucherId", "title price") // Populate voucher details
        .populate("sellerId", "storeName") // Populate seller details
        .select("vouchers sellerId purchaseDate"); // Select only necessary fields
  
      res.json({ orders });
    } catch (error) {
      console.error("Error fetching order history:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  


module.exports = { getSellerCustomers,  getSellerSummary,  placeOrder, getBuyerOrders};
