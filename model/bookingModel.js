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
            
            connection.query(
                'UPDATE bookings SET status = ? WHERE booking_id = ?',
                ['pending', booking_id],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
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
                    b.status as booking_status,
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

    static async getDetailedBookingHistoryByUserId(user_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT 
                    b.booking_id,
                    s.showtime_id,
                    f.title as film_title,
                    t.name as theater_name,
                    b.quantity,
                    b.status as payment_status,
                    b.total_amount,
                    b.booked_at,
                    f.poster,
                    s.date,
                    s.time,
                    s.price as price_per_ticket,
                    MAX(p.method) as payment_method,
                    GROUP_CONCAT(st.seat_label) as seat_labels
                FROM booking_history bh
                JOIN bookings b ON bh.booking_id = b.booking_id
                JOIN showtimes s ON bh.showtime_id = s.showtime_id
                JOIN films f ON s.film_id = f.film_id
                JOIN theaters t ON s.theater_id = t.theater_id
                LEFT JOIN payments p ON b.booking_id = p.booking_id
                LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
                LEFT JOIN seats st ON bs.seat_id = st.seat_id
                WHERE bh.user_id = ?
                GROUP BY b.booking_id, s.showtime_id
                ORDER BY b.booked_at DESC
            `, [user_id], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    static async getDetailedBookingHistoryByShowtimeId(showtimeId) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT 
                    b.status as booking_status,
                    MAX(p.gateway_txn_id) as gateway_txn_id,
                    b.booked_at,
                    f.poster,
                    f.title as film_title,
                    s.date,
                    s.time,
                    t.name as theater_name,
                    b.quantity,
                    s.price as price_per_ticket,
                    b.total_amount,
                    MAX(p.method) as payment_method,
                    GROUP_CONCAT(st.seat_label) as seat_labels
                FROM bookings b
                LEFT JOIN payments p ON b.booking_id = p.booking_id
                JOIN showtimes s ON b.showtime_id = s.showtime_id
                JOIN films f ON s.film_id = f.film_id
                JOIN theaters t ON s.theater_id = t.theater_id
                JOIN booking_seats bs ON b.booking_id = bs.booking_id
                JOIN seats st ON bs.seat_id = st.seat_id
                WHERE b.showtime_id = ?
                GROUP BY b.booking_id
                ORDER BY b.booked_at DESC
            `, [showtimeId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    static async getDetailedBookingHistoryByBookingId(booking_id) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT 
                    b.booking_id,
                    b.status as booking_status,
                    MAX(p.gateway_txn_id) as gateway_txn_id,
                    b.booked_at,
                    f.poster,
                    f.title as film_title,
                    s.date,
                    s.time,
                    t.name as theater_name,
                    b.quantity,
                    s.price as price_per_ticket,
                    b.total_amount,
                    MAX(p.method) as payment_method,
                    MAX(p.status) as payment_status,
                    GROUP_CONCAT(st.seat_label) as seat_labels
                FROM bookings b
                LEFT JOIN payments p ON b.booking_id = p.booking_id
                JOIN showtimes s ON b.showtime_id = s.showtime_id
                JOIN films f ON s.film_id = f.film_id
                JOIN theaters t ON s.theater_id = t.theater_id
                LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
                LEFT JOIN seats st ON bs.seat_id = st.seat_id
                WHERE b.booking_id = ?
                GROUP BY b.booking_id
            `, [booking_id], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    if (results.length > 0) {
                        const booking = results[0];
                        if (booking.date) {
                            const date = new Date(booking.date);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            booking.date = `${day}/${month}/${year}`;
                        }
                        if (!booking.payment_status) {
                            booking.payment_status = 'pending';
                        }
                        resolve(booking);
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    static async checkAndUpdateExpiredBookings() {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT b.booking_id, p.gateway_txn_id
                FROM bookings b
                LEFT JOIN payments p ON b.booking_id = p.booking_id
                WHERE b.status = 'pending' 
                AND p.status = 'pending'
                AND b.booked_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
            `, async (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }

                for (const booking of results) {
                    try {
                        await this.updateBookingStatus(booking.booking_id, 'cancelled');
                        
                        if (booking.gateway_txn_id) {
                            await this.updatePaymentStatus(booking.gateway_txn_id, 'expired', 'UNSPECIFIED');
                        }
                    } catch (error) {
                        console.error(`Error updating expired booking ${booking.booking_id}:`, error);
                    }
                }

                resolve(results.length);
            });
        });
    }
}

module.exports = bookingModel 