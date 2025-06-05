const connection = require('../config/database')

class UserModel {
    // Mendaftarkan user baru ke database
    static async register(data) {
        return new Promise((resolve, reject) => {
        const { name, email, password } = data
        connection.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], (err, results) => { 
            if (err) {
            reject(err)
            } else {
            resolve(results.insertId)
            }
        })
        })
    }

    // Mencari user berdasarkan email untuk login
    static async login(email) {
        return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => { 
            if (err) {
            reject(err)
            } else {
            resolve(rows[0])
            }
        })
        })
    }

    // Mengambil data user berdasarkan ID
    static async getUserById(userId) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT name, email FROM users WHERE user_id = ?', [userId], (err, rows) => { 
                if (err) {
                    reject(err)
                } else {
                    resolve(rows[0] || null)
                }
            })
        })
    }
}

module.exports = UserModel
