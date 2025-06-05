const connection = require('../config/database')

class AdminModel {
    // Mencari admin berdasarkan email untuk login
    static async login(email) {
        return new Promise((resolve, reject) => {
          connection.query('SELECT * FROM admins WHERE email = ?', [email], (err, rows) => {
                if (err) {
                reject(err)
                } else {
                resolve(rows[0])
                }
            })
        })
    }

    // Mengambil data admin berdasarkan ID
    static async getAdminById(id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT admin_id, name, email FROM admins WHERE admin_id = ?', [id], (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows[0])
                }
            })
        })
    }
}

module.exports = AdminModel