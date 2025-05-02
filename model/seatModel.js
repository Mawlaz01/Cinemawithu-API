const connection = require('../config/database')

class seatModel {
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

    static async getByTheaterId(theaterId) {
        return new Promise((resolve, reject) => {
            connection.query(`
                SELECT s.*, t.name AS theater_name 
                FROM seats s
                JOIN theaters t ON s.theater_id = t.theater_id
                WHERE s.theater_id = ?
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
}

module.exports = seatModel;