var express = require('express');
var router = express.Router();
const theater = require('../../model/theaterModel');
const { verifyToken, authorize } = require('../../config/middleware/jwt');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

router.get('/theater', verifyToken, authorize(['admin']), async (req, res) => {
  const cacheKey = 'allTheaters';
  const cachedTheaters = cache.get(cacheKey);
  if (cachedTheaters) {
    return res.status(200).json({
      status: 'success',
      data: cachedTheaters
    });
  }
  try {
    const theaters = await theater.getAll();
    cache.set(cacheKey, theaters);
    res.status(200).json({
      status: 'success',
      data: theaters
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.get('/theater/:id', verifyToken, authorize(['admin']), async (req, res) => {
  const cacheKey = `theater-${req.params.id}`;
  const theaterData = cache.get(cacheKey);
  if (theaterData) {
    return res.status(200).json({
      status: 'success',
      data: theaterData
    });
  }
  try {
    const theaterData = await theater.getById(req.params.id);
    if (!theaterData) {
      return res.status(404).json({
        status: 'error',
        message: 'Theater tidak ditemukan'
      });
    }
    res.status(200).json({
      status: 'success',
      data: theaterData
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.post('/theater/create', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    if (!req.body.name || !req.body.total_seats) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama theater dan jumlah kursi wajib diisi'
      });
    }

    const total_seats = parseInt(req.body.total_seats);
    if (isNaN(total_seats) || total_seats <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Jumlah kursi harus berupa angka positif'
      });
    }

    const theaterData = {
      name: req.body.name,
      total_seats: total_seats
    };

    const theaterId = await theater.create(theaterData);
    cache.del('allTheaters');
    res.status(201).json({
      status: 'success',
      message: 'Theater berhasil ditambahkan',
      data: { theater_id: theaterId }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.patch('/theater/update/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const theaterId = req.params.id;
    
    const existingTheater = await theater.getById(theaterId);
    if (!existingTheater) {
      return res.status(404).json({
        status: 'error',
        message: 'Theater tidak ditemukan'
      });
    }

    const theaterData = {
      name: req.body.name || existingTheater.name,
      total_seats: req.body.total_seats || existingTheater.total_seats
    };

    if (req.body.total_seats) {
      const total_seats = parseInt(req.body.total_seats);
      if (isNaN(total_seats) || total_seats <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Jumlah kursi harus berupa angka positif'
        });
      }
      theaterData.total_seats = total_seats;
    }

    const affectedRows = await theater.update(theaterId, theaterData);
    cache.del('allTheaters');
    cache.del(`theater-${theaterId}`);
    res.status(200).json({
      status: 'success',
      message: 'Theater berhasil diperbarui',
      data: { affected_rows: affectedRows }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.delete('/theater/delete/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const theaterId = req.params.id;
    
    const existingTheater = await theater.getById(theaterId);
    if (!existingTheater) {
      return res.status(404).json({
        status: 'error',
        message: 'Theater tidak ditemukan'
      });
    }

    const affectedRows = await theater.delete(theaterId);
    cache.del('allTheaters');
    cache.del(`theater-${theaterId}`);
    res.status(200).json({
      status: 'success',
      message: 'Theater berhasil dihapus',
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