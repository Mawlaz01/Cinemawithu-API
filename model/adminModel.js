const connection = require('../config/database')

class AdminModel {
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