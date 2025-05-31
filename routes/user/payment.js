const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const { verifyToken, authorize } = require('../../config/middleware/jwt');
const bookingModel = require('../../model/bookingModel');
const UserModel = require('../../model/userModel');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

router.post("/payment/:filmId/:showtimeId/:bookingId", verifyToken, authorize(["user"]), async (req, res) => {
  try {
    const { filmId, showtimeId, bookingId } = req.params;
    const user_id = req.user.id;

    const user = await UserModel.getUserById(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const booking = await bookingModel.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.user_id !== user_id) {
      return res.status(403).json({ error: "Unauthorized access to booking" });
    }

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const parameter = {
      transaction_details: {
        order_id: `CNM-${Date.now()}`,
        gross_amount: booking.total_amount,
      },
      customer_details: {
        name: user.name,
        email: user.email,
      },
      enabled_payments: [
        "bca_va",
        "bni_va",
        "bri_va",
        "other_qris"
      ]
    };

    snap.createTransaction(parameter)
      .then(async (transaction) => {
        const transactionToken = transaction.token;
        
        // Create payment record
        const paymentData = {
          booking_id: bookingId,
          gateway_txn_id: parameter.transaction_details.order_id,
          amount: booking.total_amount,
          method: 'UNSPECIFIED',
          status: 'pending',
          paid_at: null
        };

        await bookingModel.createPayment(paymentData);

        return res.status(200).json({
          token: transactionToken,
          dataPayment: {
            midtransResponse: JSON.stringify(transaction)
          }
        });
      })
      .catch((error) => {
        console.error("Midtrans Error:", error);
        return res.status(400).json({ error: error.message });
      });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get("/payment/status/:gatewayTxnId", verifyToken, authorize(["user"]), async (req, res) => {
  const cacheKey = `paymentStatus-${req.params.gatewayTxnId}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      status: 'success',
      message: 'Payment status from cache',
      data: cachedData
    });
  }
  const snap = new midtransClient.Snap({
    isProduction: false,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
  });

  try {
    const result = await snap.transaction.status(req.params.gatewayTxnId);
    
    let paymentMethod = 'UNSPECIFIED';
    if (result.payment_type === 'bank_transfer') {
      paymentMethod = 'Bank Transfer';
    } else if (result.payment_type === 'qris') {
      paymentMethod = 'QRIS';
    }

    let paymentStatus = 'pending';
    if (result.transaction_status === 'settlement') {
      paymentStatus = 'settlement';
    } else if (result.transaction_status === 'cancel') {
      paymentStatus = 'cancelled';
    } else if (result.transaction_status === 'expire') {
      paymentStatus = 'expired';
    }

    // Update payment record
    await bookingModel.updatePaymentStatus(
      req.params.gatewayTxnId,
      paymentStatus,
      paymentMethod
    );

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
