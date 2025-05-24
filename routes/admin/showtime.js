var express = require('express');
var router = express.Router();
const showtime = require('../../model/showtimeModel');
const film = require('../../model/filmModel');
const theater = require('../../model/theaterModel');
const { verifyToken, authorize } = require('../../config/middleware/jwt');

// Get all showtimes
router.get('/showtime', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const showtimes = await showtime.getAll();
    res.status(200).json({
      status: 'success',
      data: showtimes
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get showtime by ID
router.get('/showtime/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const showtimeData = await showtime.getById(req.params.id);
    if (!showtimeData) {
      return res.status(404).json({
        status: 'error',
        message: 'Jadwal tayang tidak ditemukan'
      });
    }
    res.status(200).json({
      status: 'success',
      data: showtimeData
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});



// Create new showtime
router.post('/showtime/create', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    if (!req.body.film_id || !req.body.theater_id || !req.body.date || !req.body.time || !req.body.price) {
      return res.status(400).json({
        status: 'error',
        message: 'Film ID, Theater ID, tanggal, waktu, dan harga wajib diisi'
      });
    }

    // Verify film exists
    const filmData = await film.getById(req.body.film_id);
    if (!filmData) {
      return res.status(404).json({
        status: 'error',
        message: 'Film tidak ditemukan'
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

    // Validate price
    const price = parseFloat(req.body.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Harga harus berupa angka positif'
      });
    }

    // Validate date format
    const date = new Date(req.body.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Format tanggal tidak valid'
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(req.body.time)) {
      return res.status(400).json({
        status: 'error',
        message: 'Format waktu tidak valid (HH:mm)'
      });
    }

    const showtimeData = {
      film_id: req.body.film_id,
      theater_id: req.body.theater_id,
      date: req.body.date,
      time: req.body.time,
      price: price
    };

    const showtimeId = await showtime.create(showtimeData);
    res.status(201).json({
      status: 'success',
      message: 'Jadwal tayang berhasil ditambahkan',
      data: { showtime_id: showtimeId }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Update showtime
router.patch('/showtime/update/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const showtimeId = req.params.id;
    
    const existingShowtime = await showtime.getById(showtimeId);
    if (!existingShowtime) {
      return res.status(404).json({
        status: 'error',
        message: 'Jadwal tayang tidak ditemukan'
      });
    }

    // Check if film exists if film_id is provided
    if (req.body.film_id) {
      const filmData = await film.getById(req.body.film_id);
      if (!filmData) {
        return res.status(404).json({
          status: 'error',
          message: 'Film tidak ditemukan'
        });
      }
    }

    // Check if theater exists if theater_id is provided
    if (req.body.theater_id) {
      const theaterData = await theater.getById(req.body.theater_id);
      if (!theaterData) {
        return res.status(404).json({
          status: 'error',
          message: 'Theater tidak ditemukan'
        });
      }
    }

    // Validate price if provided
    let price = existingShowtime.price;
    if (req.body.price) {
      price = parseFloat(req.body.price);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Harga harus berupa angka positif'
        });
      }
    }

    // Validate date format if provided
    let date = existingShowtime.date;
    if (req.body.date) {
      const newDate = new Date(req.body.date);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          status: 'error',
          message: 'Format tanggal tidak valid'
        });
      }
      date = req.body.date;
    }

    // Validate time format if provided
    let time = existingShowtime.time;
    if (req.body.time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(req.body.time)) {
        return res.status(400).json({
          status: 'error',
          message: 'Format waktu tidak valid (HH:mm)'
        });
      }
      time = req.body.time;
    }

    const showtimeData = {
      film_id: req.body.film_id || existingShowtime.film_id,
      theater_id: req.body.theater_id || existingShowtime.theater_id,
      date: date,
      time: time,
      price: price
    };

    const affectedRows = await showtime.update(showtimeId, showtimeData);
    res.status(200).json({
      status: 'success',
      message: 'Jadwal tayang berhasil diperbarui',
      data: { affected_rows: affectedRows }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Delete showtime
router.delete('/showtime/delete/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const showtimeId = req.params.id;
    
    const existingShowtime = await showtime.getById(showtimeId);
    if (!existingShowtime) {
      return res.status(404).json({
        status: 'error',
        message: 'Jadwal tayang tidak ditemukan'
      });
    }

    const affectedRows = await showtime.delete(showtimeId);
    res.status(200).json({
      status: 'success',
      message: 'Jadwal tayang berhasil dihapus',
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