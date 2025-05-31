const express = require('express')
const router = express.Router()
const filmModel = require('../../model/filmModel')
const userModel = require('../../model/userModel')
const bookingModel = require('../../model/bookingModel')
const { verifyToken, authorize } = require('../../config/middleware/jwt')
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

router.get('/dashboard/showing', verifyToken, authorize(['user']), async (req, res) => {
  const cacheKey = 'dashboard-showing';
  const cachedFilms = cache.get(cacheKey);
  if (cachedFilms) {
    return res.json({
      status: 'success',
      data: cachedFilms
    });
  }
  try {
    const films = await filmModel.getNowShowing()
    cache.set(cacheKey, films);
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
  const cacheKey = 'dashboard-upcoming';
  const cachedFilms = cache.get(cacheKey);
  if (cachedFilms) {
    return res.json({
      status: 'success',
      data: cachedFilms
    });
  }
  try {
    const films = await filmModel.getUpcoming()
    cache.set(cacheKey, films);
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
    const cacheKey = `dashboard-profile-${req.user.id}`;
    const cachedProfile = cache.get(cacheKey);
    if (cachedProfile) {
        return res.json({
            status: 'success',
            data: cachedProfile
        });
    }
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
    const cacheKey = `dashboard-history-${req.user.id}`;
    const cachedHistory = cache.get(cacheKey);
    if (cachedHistory) {
        return res.json({
            status: 'success',
            data: cachedHistory
        });
    }
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
    const cacheKey = `dashboard-history-detail-${req.params.bookingId}`;
    const cachedHistoryDetail = cache.get(cacheKey);
    if (cachedHistoryDetail) {
        return res.json(cachedHistoryDetail);
    }
    try {
        const bookingId = req.params.bookingId;
        const details = await bookingModel.getDetailedBookingHistoryByBookingId(bookingId);
        
        if (!details) {
            return res.status(404).json({
                status: 'error',
                message: 'Booking not found'
            });
        }
        
        cache.set(cacheKey, {
            status: 'success',
            data: [details]
        });
        
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