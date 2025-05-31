const express = require('express')
const router = express.Router()
const filmModel = require('../../model/filmModel')
const upload = require('../../config/middleware/uploudPhoto')
const { verifyToken, authorize } = require('../../config/middleware/jwt')
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

router.get('/film', verifyToken, authorize(['admin']),async (req, res) => {
  const cacheKey = 'allFilms';
  const cachedFilms = cache.get(cacheKey);
  if (cachedFilms) {
    return res.status(200).json({
      status: 'success',
      data: cachedFilms
    });
  }
  try {
    const films = await filmModel.getAll()
    cache.set(cacheKey, films);
    res.status(200).json({
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

router.get('/film/:id', verifyToken, authorize(['admin']), async (req, res) => {
  const cacheKey = `film-${req.params.id}`;
  const cachedFilm = cache.get(cacheKey);
  if (cachedFilm) {
    return res.status(200).json({
      status: 'success',
      data: cachedFilm
    });
  }
  try {
    const film = await filmModel.getById(req.params.id)
    if (!film) {
      return res.status(404).json({
        status: 'error',
        message: 'Film tidak ditemukan'
      })
    }
    res.status(200).json({
      status: 'success',
      data: film
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

router.post('/film/create', verifyToken, authorize(['admin']), upload.single('poster'), async (req, res) => {
  try {
    if (!req.body.title || !req.body.duration_min) {
      return res.status(400).json({
        status: 'error',
        message: 'Judul film dan durasi wajib diisi'
      })
    }

    const duration = parseInt(req.body.duration_min)
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Durasi film harus berupa angka positif'
      })
    }

    const filmData = {
      title: req.body.title,
      genre: req.body.genre,
      description: req.body.description,
      duration_min: duration,
      release_date: req.body.release_date || null,
      status: req.body.status,
      poster: req.file ? `${req.file.filename}` : null
    }

    const filmId = await filmModel.create(filmData)
    res.status(201).json({
      status: 'success',
      message: 'Film berhasil ditambahkan',
      data: { film_id: filmId }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

router.patch('/film/update/:id', verifyToken, authorize(['admin']), upload.single('poster'), async (req, res) => {
  try {
    const filmId = req.params.id
    
    const existingFilm = await filmModel.getById(filmId)
    if (!existingFilm) {
      return res.status(404).json({
        status: 'error',
        message: 'Film tidak ditemukan'
      })
    }

    if (req.body.duration_min) {
      const duration = parseInt(req.body.duration_min)
      if (isNaN(duration) || duration <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Durasi film harus berupa angka positif'
        })
      }
      req.body.duration_min = duration
    }

    const filmData = {
      title: req.body.title,
      genre: req.body.genre,
      description: req.body.description,
      duration_min: req.body.duration_min,
      release_date: req.body.release_date,
      status: req.body.status
    }

    if (req.file) {
      filmData.poster = `${req.file.filename}`
    }

    const affectedRows = await filmModel.update(filmId, filmData)
    res.status(200).json({
      status: 'success',
      message: 'Film berhasil diperbarui',
      data: { affected_rows: affectedRows }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

router.delete('/film/delete/:id', verifyToken, authorize(['admin']), async (req, res) => {
  try {
    const filmId = req.params.id
    
    const existingFilm = await filmModel.getById(filmId)
    if (!existingFilm) {
      return res.status(404).json({
        status: 'error',
        message: 'Film tidak ditemukan'
      })
    }

    const affectedRows = await filmModel.delete(filmId)
    res.status(200).json({
      status: 'success',
      message: 'Film berhasil dihapus',
      data: { affected_rows: affectedRows }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

module.exports = router
