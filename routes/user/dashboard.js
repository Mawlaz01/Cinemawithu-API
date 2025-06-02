const express = require('express')
const router = express.Router()
const filmModel = require('../../model/filmModel')
const userModel = require('../../model/userModel')
const bookingModel = require('../../model/bookingModel')
const { verifyToken, authorize } = require('../../config/middleware/jwt')

router.get('/dashboard/showing', verifyToken, authorize(['user']), async (req, res) => {
  try {
    const films = await filmModel.getNowShowing()
    res.json({
      status: 'success',
      data: films
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

router.get('/dashboard/upcoming', verifyToken, authorize(['user']), async (req, res) => {
  try {
    const films = await filmModel.getUpcoming()
    res.json({
      status: 'success',
      data: films
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

router.get('/dashboard/profile', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const userId = req.user.id
        const userData = await userModel.getUserById(userId)
        
        if (!userData) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            })
        }

        res.json({
            status: 'success',
            data: userData
        })
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        })
    }
})

router.get('/dashboard/history', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const userId = req.user.id
        const bookingHistory = await bookingModel.getDetailedBookingHistoryByUserId(userId)
        
        res.json({
            status: 'success',
            data: bookingHistory
        })
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        })
    }
})

router.get('/dashboard/history/:bookingId', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const details = await bookingModel.getDetailedBookingHistoryByBookingId(bookingId);
        
        if (!details) {
            return res.status(404).json({
                status: 'error',
                message: 'Booking not found'
            });
        }
        
        res.json({
            status: 'success',
            data: [details]
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router