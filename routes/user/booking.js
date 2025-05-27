const express = require('express')
const router = express.Router()
const filmModel = require('../../model/filmModel')
const showtimeModel = require('../../model/showtimeModel')
const seatModel = require('../../model/seatModel')
const { verifyToken, authorize } = require('../../config/middleware/jwt')
const bookingModel = require('../../model/bookingModel')

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

router.get('/dashboard/detailfilm/:filmId/:showtimeId/seat', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const { filmId, showtimeId } = req.params

        // Verify if film exists
        const film = await filmModel.getById(filmId)
        if (!film) {
            return res.status(404).json({
                status: 'error',
                message: 'Film tidak ditemukan'
            })
        }

        // Get showtime details
        const showtime = await showtimeModel.getById(showtimeId)
        if (!showtime) {
            return res.status(404).json({
                status: 'error',
                message: 'Jadwal tayang tidak ditemukan'
            })
        }

        // Format date
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

        // Get all seats for the film
        const seats = await seatModel.getSeatsByFilmId(filmId)
        
        // Get booked seats for the film
        const bookedSeats = await seatModel.getBookedSeatsByFilmId(filmId)
        
        // Create a map of booked seats for easy lookup
        const bookedSeatsMap = new Map(bookedSeats.map(seat => [seat.seat_id, true]))

        // Add availability status to each seat
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

router.post('/booking/:showtimeId', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const { showtimeId } = req.params
        let { seat_ids, quantity } = req.body
        const user_id = req.user.id // Get user_id from JWT token

        // Jika seat_ids masih string, ubah jadi array
        if (typeof seat_ids === 'string') {
            seat_ids = seat_ids.split(',').map(id => parseInt(id.trim()))
        }

        // Check for existing pending bookings for the user
        const existingBookings = await bookingModel.getBookingsByUserId(user_id);
        const hasPendingBooking = existingBookings.some(booking => booking.status === 'pending');

        if (hasPendingBooking) {
            return res.status(400).json({
                status: 'error',
                message: 'Anda memiliki pesanan yang masih dalam status pending, Mohon selesaikan pesanan terlebih dahulu.'
            });
        }

        // Validate required fields
        if (!seat_ids || !quantity) {
            return res.status(400).json({
                status: 'error',
                message: 'Semua field harus diisi'
            })
        }

        // Validate seat_ids is an array
        if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Pilih minimal satu kursi'
            })
        }

        // Validate quantity matches number of seats
        if (parseInt(quantity) !== seat_ids.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Jumlah tiket harus sesuai dengan jumlah kursi yang dipilih'
            })
        }

        // Get showtime details to get the price
        const showtime = await showtimeModel.getById(showtimeId);
        if (!showtime) {
            return res.status(404).json({
                status: 'error',
                message: 'Jadwal tayang tidak ditemukan'
            });
        }

        // Calculate total amount
        const total_amount = showtime.price * quantity;

        // Create booking
        const booking_id = await bookingModel.createBooking({
            user_id,
            showtime_id: showtimeId,
            quantity,
            total_amount
        })

        // Assign seats to booking
        await bookingModel.assignSeatsToBooking(booking_id, seat_ids)

        // Get the created booking
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

router.post('/booking/history/:showtimeId', verifyToken, authorize(['user']), async (req, res) => {
    try {
        const { showtimeId } = req.params
        const { booking_id } = req.body
        const user_id = req.user.id // Get user_id from JWT token

        // Validate required fields
        if (!booking_id) {
            return res.status(400).json({
                status: 'error',
                message: 'Booking ID is required'
            })
        }

        // Create booking history entry
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

module.exports = router
