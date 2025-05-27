const connection = require('../config/database')

class bookingModel {
    static async createBooking(data) {
        return new Promise((resolve, reject) => {
            const { user_id, showtime_id, quantity, total_amount } = data
            
            connection.query(
                'INSERT INTO bookings (user_id, showtime_id, quantity, total_amount) VALUES (?, ?, ?, ?)',
                [user_id, showtime_id, quantity, total_amount],
                (err, results) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(results.insertId)
                    }
                }
            )
        })
    }

    static async assignSeatsToBooking(booking_id, seat_ids) {
        return new Promise((resolve, reject) => {
            const values = seat_ids.map(seat_id => [booking_id, seat_id])
            
            connection.query(
                'INSERT INTO booking_seats (booking_id, seat_id) VALUES ?',
                [values],
                (err, results) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(results.affectedRows)
                    }
                }
            )
        })
    }

    static async getBookingById(id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM bookings WHERE booking_id = ?', [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results[0] || null)
                }
            })
        })
    }

    static async getBookingsByUserId(user_id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM bookings WHERE user_id = ?', [user_id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }

    static async updateBookingStatus(id, status) {
        return new Promise((resolve, reject) => {
            connection.query(
                'UPDATE bookings SET status = ? WHERE booking_id = ?',
                [status, id],
                (err, results) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(results.affectedRows)
                    }
                }
            )
        })
    }

    static async createBookingHistory(data) {
        return new Promise((resolve, reject) => {
            const { user_id, booking_id, showtime_id } = data
            
            connection.query(
                'INSERT INTO booking_history (user_id, booking_id, showtime_id) VALUES (?, ?, ?)',
                [user_id, booking_id, showtime_id],
                (err, results) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(results.insertId)
                    }
                }
            )
        })
    }

    static async getBookingHistoryByUserId(user_id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM booking_history WHERE user_id = ?', [user_id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    // You might want to join with other tables like bookings, showtimes, films for a more detailed history view
                    resolve(results)
                }
            })
        })
    }

    static async getBookingByShowtimeId(showtime_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT b.*, s.price, s.date, s.time, t.name as theater_name, f.title as film_title
                FROM bookings b
                JOIN showtimes s ON b.showtime_id = s.showtime_id
                JOIN theaters t ON s.theater_id = t.theater_id
                JOIN films f ON s.film_id = f.film_id
                WHERE b.showtime_id = ?
            `, [showtime_id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results[0] || null)
                }
            })
        })
    }

    static async getBookingHistoryByShowtimeId(showtime_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT bh.*, b.status, b.total_amount, s.price, s.date, s.time, t.name as theater_name, f.title as film_title
                FROM booking_history bh
                JOIN bookings b ON bh.booking_id = b.booking_id
                JOIN showtimes s ON bh.showtime_id = s.showtime_id
                JOIN theaters t ON s.theater_id = t.theater_id
                JOIN films f ON s.film_id = f.film_id
                WHERE bh.showtime_id = ?
            `, [showtime_id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results[0] || null)
                }
            })
        })
    }
}

module.exports = bookingModel 