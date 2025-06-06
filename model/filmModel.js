const connection = require('../config/database')

class filmModel {
    // Mengambil semua data film dari database
    static async getAll() {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM films', (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }

    // Mengambil data film berdasarkan ID
    static async getById(id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM films WHERE film_id = ?', [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results[0] || null)
                }
            })
        })
    }

    // Membuat data film baru
    static async create(data) {
        return new Promise((resolve, reject) => {
            const { title, poster, genre, description, duration_min, release_date, status } = data
            
            const duration = parseInt(duration_min) || null
            
            connection.query(
                'INSERT INTO films (title, poster, genre, description, duration_min, release_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, poster, genre, description, duration, release_date, status],
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

    // Mengupdate data film berdasarkan ID
    static async update(id, data) {
        return new Promise((resolve, reject) => {
            const { title, poster, genre, description, duration_min, release_date, status } = data
            connection.query(
                'UPDATE films SET title = ?, poster = ?, genre = ?, description = ?, duration_min = ?, release_date = ?, status = ? WHERE film_id = ?',
                [title, poster, genre, description, duration_min, release_date, status, id],
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

    // Menghapus data film berdasarkan ID
    static async delete(id) {
        return new Promise((resolve, reject) => {
            connection.query('DELETE FROM films WHERE film_id = ?', [id], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results.affectedRows)
                }
            })
        })
    }

    // Mengambil film yang sedang tayang
    static async getNowShowing() {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM films WHERE status = ?', ['now_showing'], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }

    // Mengambil film yang akan datang
    static async getUpcoming() {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM films WHERE status = ?', ['upcoming'], (err, results) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }
}

module.exports = filmModel
