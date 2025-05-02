const connection = require('../config/database')

class theaterModel {
    static async getAll() {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM theaters', (err, results) => {
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
            connection.query('SELECT * FROM theaters WHERE theater_id = ?', [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results[0] || null)
                }
            })
        })
    }

    static async create(data) {
        return new Promise((resolve, reject) => {
            const { name, total_seats } = data
            
            const seats = parseInt(total_seats) || null
            
            connection.query(
                'INSERT INTO theaters (name, total_seats) VALUES (?, ?)',
                [name, seats],
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
            const { name, total_seats } = data
            
            const seats = parseInt(total_seats) || null
            
            connection.query(
                'UPDATE theaters SET name = ?, total_seats = ? WHERE theater_id = ?',
                [name, seats, id],
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
            connection.query('DELETE FROM theaters WHERE theater_id = ?', [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results.affectedRows)
                }
            })
        })
    }
}

module.exports = theaterModel