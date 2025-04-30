var express = require('express')
var router = express.Router()
const admin = require('../../model/adminModel')
const user = require('../../model/userModel')
const jwt = require('jsonwebtoken')

router.post('/login', async (req, res, next) => {
    let { email, password } = req.body

    if (!email) {
        return res.status(400).json ({ message: 'Email required'})
    } else if (!password) {
        return res.status(400).json ({ message: 'Password required'})
    }

    try {
        let userData = null
        let userType = null

        userData = await user.login(email)
        if (userData) {
            userType = 'user'
        } else {
            userData = await admin.login(email)
            if (userData) {
                userType = 'admin'
            }
        }

        if (!userData) {
            return res.status(401).json ({ message: 'Email wrong'})
        } else if (password !== userData.password) {
            return res.status(401).json ({ message: 'Password wrong'})
        }

        let payload = {}
        if (userType == 'user') {
            payload = { id: userData.user_id, username: userData.name, type: 'user'}
        } else if (userType == 'admin') {
            payload = { id: userData.admin_id, username: userData.name, type: 'admin'}
        }

        const token = jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: '1h'})

        res.status(200).json ({ message: 'OK', userType, token})
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router;
