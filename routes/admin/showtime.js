var express = require('express');
var router = express.Router();
const showtime = require('../../model/showtimeModel');
const film = require('../../model/filmModel');
const theater = require('../../model/theaterModel');
const { verifyToken, authorize } = require('../../config/middleware/jwt');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

router.get('/showtime', verifyToken, authorize(['admin']), async (req, res) => {
  const cacheKey = 'allShowtimes';
  const cachedShowtimes = cache.get(cacheKey);
  if (cachedShowtimes) {
    return res.status(200).json({
      status: 'success',
      data: cachedShowtimes
    });
  }
  try {
    const showtimes = await showtime.getAll();
    cache.set(cacheKey, showtimes);
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

router.get('/showtime/:id', verifyToken, authorize(['admin']), async (req, res) => {
  const cacheKey = `showtime-${req.params.id}`;
  const cachedShowtime = cache.get(cacheKey);
  if (cachedShowtime) {
    return res.status(200).json({
      status: 'success',
      data: cachedShowtime
    });
  }
  try {
    const showtimeData = await showtime.getById(req.params.id);
    if (!showtimeData) {
      return res.status(404).json({
        status: 'error',
        message: 'Jadwal tayang tidak ditemukan'
      });
    }
    cache.set(cacheKey, showtimeData);
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

router.post('/showtime/create', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    if (!req.body.film_id || !req.body.theater_id || !req.body.date || !req.body.time || !req.body.price) {
      return res.status(400).json({
        status: 'error',
        message: 'Film ID, Theater ID, tanggal, waktu, dan harga wajib diisi'
      });
    }

    const filmData = await film.getById(req.body.film_id);
    if (!filmData) {
      return res.status(404).json({
        status: 'error',
        message: 'Film tidak ditemukan'
      });
    }

    const theaterData = await theater.getById(req.body.theater_id);
    if (!theaterData) {
      return res.status(404).json({
        status: 'error',
        message: 'Theater tidak ditemukan'
      });
    }

    const price = parseFloat(req.body.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Harga harus berupa angka positif'
      });
    }

    const date = new Date(req.body.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Format tanggal tidak valid'
      });
    }

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
    cache.del('allShowtimes');
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

    if (req.body.film_id) {
      const filmData = await film.getById(req.body.film_id);
      if (!filmData) {
        return res.status(404).json({
          status: 'error',
          message: 'Film tidak ditemukan'
        });
      }
    }

    if (req.body.theater_id) {
      const theaterData = await theater.getById(req.body.theater_id);
      if (!theaterData) {
        return res.status(404).json({
          status: 'error',
          message: 'Theater tidak ditemukan'
        });
      }
    }

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
    cache.del('allShowtimes');
    cache.del(`showtime-${showtimeId}`);
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
    cache.del('allShowtimes');
    cache.del(`showtime-${showtimeId}`);
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