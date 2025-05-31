var express = require('express');
var router = express.Router();
const seat = require('../../model/seatModel');
const theater = require('../../model/theaterModel');
const { verifyToken, authorize } = require('../../config/middleware/jwt');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

// Get all seats
router.get('/seat', verifyToken, authorize(['admin']), async (req, res) => {
  const cacheKey = 'allSeats';
  const cachedSeats = cache.get(cacheKey);
  if (cachedSeats) {
    return res.status(200).json({
      status: 'success',
      data: cachedSeats
    });
  }
  try {
    const seats = await seat.getAll();
    cache.set(cacheKey, seats);
    res.status(200).json({
      status: 'success',
      data: seats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get seat by ID
router.get('/seat/:id', verifyToken, authorize(['admin']), async (req, res) => {
  const cacheKey = `seat-${req.params.id}`;
  const cachedSeat = cache.get(cacheKey);
  if (cachedSeat) {
    return res.status(200).json({
      status: 'success',
      data: cachedSeat
    });
  }
  try {
    const seatData = await seat.getById(req.params.id);
    if (!seatData) {
      return res.status(404).json({
        status: 'error',
        message: 'Kursi tidak ditemukan'
      });
    }
    cache.set(cacheKey, seatData);
    res.status(200).json({
      status: 'success',
      data: seatData
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Create new seat
router.post('/seat/create', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    if (!req.body.theater_id || !req.body.seat_label) {
      return res.status(400).json({
        status: 'error',
        message: 'ID theater dan label kursi wajib diisi'
      });
    }

    // Verify theater exists
    const theaterData = await theater.getById(req.body.theater_id);
    if (!theaterData) {
      return res.status(404).json({
        status: 'error',
        message: 'Theater tidak ditemukan'
      });
    }

    // Validate seat label format (optional)
    const seatLabelRegex = /^[A-Z][0-9]+$/;
    if (!seatLabelRegex.test(req.body.seat_label)) {
      return res.status(400).json({
        status: 'error',
        message: 'Format label kursi tidak valid. Gunakan format seperti A1, B2, dll.'
      });
    }

    const seatData = {
      theater_id: req.body.theater_id,
      seat_label: req.body.seat_label
    };

    const seatId = await seat.create(seatData);
    res.status(201).json({
      status: 'success',
      message: 'Kursi berhasil ditambahkan',
      data: { seat_id: seatId }
    });
  } catch (error) {
    // Check for unique constraint violation
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        status: 'error',
        message: 'Kursi dengan label tersebut sudah ada di theater ini'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Update seat
router.patch('/seat/update/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const seatId = req.params.id;
    
    const existingSeat = await seat.getById(seatId);
    if (!existingSeat) {
      return res.status(404).json({
        status: 'error',
        message: 'Kursi tidak ditemukan'
      });
    }

    // If theater_id is being updated, verify theater exists
    if (req.body.theater_id) {
      const theaterData = await theater.getById(req.body.theater_id);
      if (!theaterData) {
        return res.status(404).json({
          status: 'error',
          message: 'Theater tidak ditemukan'
        });
      }
    }

    // If seat_label is being updated, validate format
    if (req.body.seat_label) {
      const seatLabelRegex = /^[A-Z][0-9]+$/;
      if (!seatLabelRegex.test(req.body.seat_label)) {
        return res.status(400).json({
          status: 'error',
          message: 'Format label kursi tidak valid. Gunakan format seperti A1, B2, dll.'
        });
      }
    }

    const seatData = {
      theater_id: req.body.theater_id || existingSeat.theater_id,
      seat_label: req.body.seat_label || existingSeat.seat_label
    };

    const affectedRows = await seat.update(seatId, seatData);
    res.status(200).json({
      status: 'success',
      message: 'Kursi berhasil diperbarui',
      data: { affected_rows: affectedRows }
    });
  } catch (error) {
    // Check for unique constraint violation
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        status: 'error',
        message: 'Kursi dengan label tersebut sudah ada di theater ini'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Delete seat
router.delete('/seat/delete/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const seatId = req.params.id;
    
    const existingSeat = await seat.getById(seatId);
    if (!existingSeat) {
      return res.status(404).json({
        status: 'error',
        message: 'Kursi tidak ditemukan'
      });
    }

    const affectedRows = await seat.delete(seatId);
    res.status(200).json({
      status: 'success',
      message: 'Kursi berhasil dihapus',
      data: { affected_rows: affectedRows }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;