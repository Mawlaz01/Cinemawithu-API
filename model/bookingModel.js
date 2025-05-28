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

    static async createPayment(data) {
        return new Promise((resolve, reject) => {
            const { booking_id, gateway_txn_id, amount, method, status, paid_at } = data;
            
            // Update booking status to pending
            connection.query(
                'UPDATE bookings SET status = ? WHERE booking_id = ?',
                ['pending', booking_id],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Insert payment record
                    connection.query(
                        'INSERT INTO payments (booking_id, gateway_txn_id, amount, method, status, paid_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [booking_id, gateway_txn_id, amount, method, status, paid_at],
                        (err, results) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(results.insertId);
                            }
                        }
                    );
                }
            );
        });
    }

    static async updatePaymentStatus(gateway_txn_id, status, method) {
        return new Promise((resolve, reject) => {
            connection.query(
                'UPDATE payments SET status = ?, method = ?, paid_at = CASE WHEN ? = "settlement" THEN CURRENT_TIMESTAMP ELSE paid_at END WHERE gateway_txn_id = ?',
                [status, method, status, gateway_txn_id],
                (err, results) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Update booking status based on payment status
                    let bookingStatus;
                    if (status === 'settlement') {
                        bookingStatus = 'paid';
                    } else if (status === 'cancelled' || status === 'expired') {
                        bookingStatus = 'cancelled';
                    }

                    if (bookingStatus) {
                        connection.query(
                            'UPDATE bookings b JOIN payments p ON b.booking_id = p.booking_id SET b.status = ? WHERE p.gateway_txn_id = ?',
                            [bookingStatus, gateway_txn_id],
                            (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(results.affectedRows);
                                }
                            }
                        );
                    } else {
                        resolve(results.affectedRows);
                    }
                }
            );
        });
    }

    static async getPaymentByBookingId(booking_id) {
        return new Promise((resolve, reject) => {
            connection.query(
                'SELECT * FROM payments WHERE booking_id = ?',
                [booking_id],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results[0] || null);
                    }
                }
            );
        });
    }

    static async getDetailedBookingInfo(filmId, showtimeId, bookingId) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT 
                    f.poster,
                    f.title as film_title,
                    t.name as theater_name,
                    s.date,
                    s.time,
                    b.quantity,
                    b.total_amount,
                    GROUP_CONCAT(st.seat_label) as seat_labels
                FROM bookings b
                JOIN showtimes s ON b.showtime_id = s.showtime_id
                JOIN films f ON s.film_id = f.film_id
                JOIN theaters t ON s.theater_id = t.theater_id
                JOIN booking_seats bs ON b.booking_id = bs.booking_id
                JOIN seats st ON bs.seat_id = st.seat_id
                WHERE f.film_id = ? 
                AND s.showtime_id = ? 
                AND b.booking_id = ?
                GROUP BY b.booking_id
            `, [filmId, showtimeId, bookingId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    if (results.length > 0) {
                        // Format the date
                        const booking = results[0];
                        if (booking.date) {
                            const date = new Date(booking.date);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            booking.date = `${day}/${month}/${year}`;
                        }
                        resolve(booking);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }
}

module.exports = bookingModel 