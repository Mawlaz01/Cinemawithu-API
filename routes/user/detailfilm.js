const express = require('express')
const router = express.Router()
const filmModel = require('../../model/filmModel')
const showtimeModel = require('../../model/showtimeModel')
const { verifyToken, authorize } = require('../../config/middleware/jwt')

router.get('/dashboard/detailfilm/:filmId', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const { filmId } = req.params

        const film = await filmModel.getById(filmId)
        if (!film) {
            return res.status(404).json({
                status: 'error',
                message: 'Film tidak ditemukan'
            })
        }

        const response = {
            status: 'success',
            data: {
                film: film
            }
        }

        if (film.status === 'now_showing') {
            const showtimes = await showtimeModel.getByFilmId(filmId)

            const formattedShowtimes = showtimes.map(showtime => {

                let dateStr;
                if (showtime.date instanceof Date) {

                    const year = showtime.date.getFullYear();
                    const month = String(showtime.date.getMonth() + 1).padStart(2, '0');
                    const day = String(showtime.date.getDate()).padStart(2, '0');
                    dateStr = `${year}-${month}-${day}`;
                } else if (typeof showtime.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(showtime.date)) {

                    dateStr = showtime.date;
                } else {
                    dateStr = String(showtime.date);
                }

                let formatted_date = dateStr;
                const dateParts = dateStr.split('-');
                if (dateParts.length === 3) {
                    formatted_date = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }

                return {
                    ...showtime,
                    date: dateStr,
                    time: showtime.time,
                    formatted_date: formatted_date
                }
            });
            response.data.showtimes = formattedShowtimes;
        }

        res.json(response)
    } catch (error) {
        console.error('Error in detail film route:', error)
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server'
        })
    }
})

module.exports = router
