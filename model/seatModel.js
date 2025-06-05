const connection = require('../config/database')

class seatModel {
    // Mengambil semua data kursi dengan detail theater
    static async getAll() {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT s.*, t.name AS theater_name 
                FROM seats s
                JOIN theaters t ON s.theater_id = t.theater_id
            `, (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }

    // Mengambil data kursi berdasarkan ID dengan detail theater
    static async getById(id) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT s.*, t.name AS theater_name 
                FROM seats s
                JOIN theaters t ON s.theater_id = t.theater_id
                WHERE s.seat_id = ?
            `, [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results[0] || null)
                }
            })
        })
    }

    // Membuat data kursi baru
    static async create(data) {
        return new Promise((resolve, reject) => {
            const { theater_id, seat_label } = data
            
            connection.query(
                'INSERT INTO seats (theater_id, seat_label) VALUES (?, ?)',
                [theater_id, seat_label],
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

    // Mengupdate data kursi berdasarkan ID
    static async update(id, data) {
        return new Promise((resolve, reject) => {
            const { theater_id, seat_label } = data
            
            connection.query(
                'UPDATE seats SET theater_id = ?, seat_label = ? WHERE seat_id = ?',
                [theater_id, seat_label, id],
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

    // Menghapus data kursi berdasarkan ID
    static async delete(id) {
        return new Promise((resolve, reject) => {
            connection.query('DELETE FROM seats WHERE seat_id = ?', [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results.affectedRows)
                }
            })
        })
    }

    // Mengambil semua kursi yang tersedia untuk film tertentu
    static async getSeatsByFilmId(filmId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT DISTINCT s.* 
                FROM seats s
                INNER JOIN theaters t ON s.theater_id = t.theater_id
                INNER JOIN showtimes st ON st.theater_id = t.theater_id
                WHERE st.film_id = ?
            `
            connection.query(query, [filmId], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }

    // Mengambil kursi yang sudah dipesan untuk film dan jadwal tertentu
    static async getBookedSeatsByFilmId(filmId, showtimeId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT DISTINCT s.seat_id, s.seat_label, b.status as booking_status
                FROM seats s
                INNER JOIN booking_seats bs ON s.seat_id = bs.seat_id
                INNER JOIN bookings b ON bs.booking_id = b.booking_id
                INNER JOIN showtimes st ON b.showtime_id = st.showtime_id
                WHERE st.film_id = ? AND b.showtime_id = ? AND (b.status = 'paid' OR b.status = 'pending')
            `
            connection.query(query, [filmId, showtimeId], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }
}

module.exports = seatModel;