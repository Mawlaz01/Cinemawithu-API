const connection = require('../config/database')

class theaterModel {
    // Mengambil semua data theater dari database
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

    // Mengambil data theater berdasarkan ID
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

    // Membuat data theater baru
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

    // Mengupdate data theater berdasarkan ID
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

    // Menghapus data theater berdasarkan ID
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