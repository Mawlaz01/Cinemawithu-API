const connection = require('../config/database')

class showtimeModel {
    static async getAll() {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT s.*, f.title AS film_title, t.name AS theater_name 
                FROM showtimes s
                JOIN films f ON s.film_id = f.film_id
                JOIN theaters t ON s.theater_id = t.theater_id
                ORDER BY s.date, s.time
            `, (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }

    static async getById(id) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT s.*, f.title AS film_title, t.name AS theater_name 
                FROM showtimes s
                JOIN films f ON s.film_id = f.film_id
                JOIN theaters t ON s.theater_id = t.theater_id
                WHERE s.showtime_id = ?
            `, [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results[0] || null)
                }
            })
        })
    }

    static async getByFilmId(filmId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT s.*, t.name as theater_name, t.total_seats
                FROM showtimes s
                JOIN theaters t ON s.theater_id = t.theater_id
                WHERE s.film_id = ?
                ORDER BY s.date ASC, s.time ASC
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

    static async getByTheaterId(theaterId) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT s.*, f.title AS film_title, t.name AS theater_name 
                FROM showtimes s
                JOIN films f ON s.film_id = f.film_id
                JOIN theaters t ON s.theater_id = t.theater_id
                WHERE s.theater_id = ?
                ORDER BY s.date, s.time
            `, [theaterId], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }

    static async create(data) {
        return new Promise((resolve, reject) => {
            const { film_id, theater_id, date, time, price } = data
            
            connection.query(
                'INSERT INTO showtimes (film_id, theater_id, date, time, price) VALUES (?, ?, ?, ?, ?)',
                [film_id, theater_id, date, time, price],
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

    static async update(id, data) {
        return new Promise((resolve, reject) => {
            const { film_id, theater_id, date, time, price } = data
            
            connection.query(
                'UPDATE showtimes SET film_id = ?, theater_id = ?, date = ?, time = ?, price = ? WHERE showtime_id = ?',
                [film_id, theater_id, date, time, price, id],
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

    static async delete(id) {
        return new Promise((resolve, reject) => {
            connection.query('DELETE FROM showtimes WHERE showtime_id = ?', [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results.affectedRows)
                }
            })
        })
    }
}

module.exports = showtimeModel
