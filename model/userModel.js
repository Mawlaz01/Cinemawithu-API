const connection = require('../config/database')

class UserModel {
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

    static async getUserById(userId) {
        return new Promise((resolve, reject) => {
        connection.query('SELECT name FROM users WHERE user_id = ?', [userId], (err, rows) => { 
            if (err) {
            reject(err)
            } else {
            resolve(rows[0] ? rows[0].name : null)
            }
        })
        })
    }
}

module.exports = UserModel
