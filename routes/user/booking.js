const express = require('express')
const router = express.Router()
const filmModel = require('../../model/filmModel')
const showtimeModel = require('../../model/showtimeModel')
const seatModel = require('../../model/seatModel')
const { verifyToken, authorize } = require('../../config/middleware/jwt')
const bookingModel = require('../../model/bookingModel')

// Mengambil detail film dan jadwal tayangnya
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

// Mengambil data kursi yang tersedia untuk film dan jadwal tertentu
router.get('/dashboard/detailfilm/:filmId/:showtimeId/seat', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const { filmId, showtimeId } = req.params

        const film = await filmModel.getById(filmId)
        if (!film) {
            return res.status(404).json({
                status: 'error',
                message: 'Film tidak ditemukan'
            })
        }

        const showtime = await showtimeModel.getById(showtimeId)
        if (!showtime) {
            return res.status(404).json({
                status: 'error',
                message: 'Jadwal tayang tidak ditemukan'
            })
        }

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

        const seats = await seatModel.getSeatsByFilmId(filmId)
        const bookedSeats = await seatModel.getBookedSeatsByFilmId(filmId, showtimeId)
        const bookedSeatsMap = new Map(bookedSeats.map(seat => [seat.seat_id, true]))

        const seatsWithAvailability = seats.map(seat => ({
            ...seat,
            is_available: !bookedSeatsMap.has(seat.seat_id)
        }))

        res.json({
            status: 'success',
            data: {
                film_id: film.film_id,
                film_title: film.title,
                film_poster: film.poster,
                showtime: {
                    date: formatted_date,
                    time: showtime.time,
                    theater_name: showtime.theater_name
                },
                seats: seatsWithAvailability
            }
        })
    } catch (error) {
        console.error('Error in get seats route:', error)
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server'
        })
    }
})

// Membuat booking baru dengan validasi kursi dan jumlah tiket
router.post('/booking/:showtimeId', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const { showtimeId } = req.params
        let { seat_ids, quantity } = req.body
        const user_id = req.user.id

        if (typeof seat_ids === 'string') {
            seat_ids = seat_ids.split(',').map(id => parseInt(id.trim()))
        }

        const existingBookings = await bookingModel.getBookingsByUserId(user_id);
        const hasPendingBooking = existingBookings.some(booking => booking.status === 'pending');

        if (hasPendingBooking) {
            return res.status(400).json({
                status: 'error',
                message: 'Anda memiliki pesanan yang masih dalam status pending, Mohon selesaikan pesanan terlebih dahulu.'
            });
        }

        if (!seat_ids || !quantity) {
            return res.status(400).json({
                status: 'error',
                message: 'Semua field harus diisi'
            })
        }

        if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Pilih minimal satu kursi'
            })
        }

        if (parseInt(quantity) !== seat_ids.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Jumlah tiket harus sesuai dengan jumlah kursi yang dipilih'
            })
        }

        const showtime = await showtimeModel.getById(showtimeId);
        if (!showtime) {
            return res.status(404).json({
                status: 'error',
                message: 'Jadwal tayang tidak ditemukan'
            });
        }

        const total_amount = showtime.price * quantity;

        const booking_id = await bookingModel.createBooking({
            user_id,
            showtime_id: showtimeId,
            quantity,
            total_amount
        })

        await bookingModel.assignSeatsToBooking(booking_id, seat_ids)

        const booking = await bookingModel.getBookingById(booking_id)

        res.status(201).json({
            status: 'success',
            message: 'Booking berhasil dibuat',
            data: booking
        })
    } catch (error) {
        console.error('Error in create booking route:', error)
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server'
        })
    }
})

// Membuat history booking untuk tracking
router.post('/booking/history/:showtimeId', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const { showtimeId } = req.params
        const { booking_id } = req.body
        const user_id = req.user.id

        if (!booking_id) {
            return res.status(400).json({
                status: 'error',
                message: 'Booking ID is required'
            })
        }

        const historyId = await bookingModel.createBookingHistory({
            user_id,
            booking_id,
            showtime_id: showtimeId
        })

        res.status(201).json({
            status: 'success',
            message: 'Booking history created successfully',
            data: { history_id: historyId }
        })
    } catch (error) {
        console.error('Error in create booking history route:', error)
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server'
        })
    }
})

// Mengambil status booking berdasarkan ID
router.get('/booking/:filmId/:showtimeId/:bookingId/status', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const { filmId, showtimeId, bookingId } = req.params;
        const user_id = req.user.id;

        const bookingDetails = await bookingModel.getDetailedBookingInfo(filmId, showtimeId, bookingId);
        
        if (!bookingDetails) {
            return res.status(404).json({
                status: 'error',
                message: 'Booking tidak ditemukan'
            });
        }

        res.json({
            status: 'success',
            data: {
                film: {
                    poster: bookingDetails.poster,
                    title: bookingDetails.film_title
                },
                showtime: {
                    theater: bookingDetails.theater_name,
                    date: bookingDetails.date,
                    time: bookingDetails.time
                },
                booking: {
                    quantity: bookingDetails.quantity,
                    seats: bookingDetails.seat_labels.split(','),
                    total_amount: bookingDetails.total_amount,
                    status: bookingDetails.booking_status
                }
            }
        });
    } catch (error) {
        console.error('Error in get booking status route:', error);
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server'
        });
    }
});

module.exports = router
