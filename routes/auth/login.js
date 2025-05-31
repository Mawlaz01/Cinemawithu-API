var express = require('express')
var router = express.Router()
const admin = require('../../model/adminModel')
const user = require('../../model/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { verifyToken } = require('../../config/middleware/jwt')
const limiter = require('../../config/middleware/rateLimiter')
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

router.post('/login', limiter, async (req, res, next) => {
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
        }

        const validPassword = await bcrypt.compare(password, userData.password)
        if (!validPassword) {
            return res.status(401).json ({ message: 'Password wrong'})
        }

        let payload = {}
        if (userType == 'user') {
            payload = { id: userData.user_id, username: userData.name, type: 'user'}
        } else if (userType == 'admin') {
            payload = { id: userData.admin_id, username: userData.name, type: 'admin'}
        }

        const token = jwt.sign(payload, process.env.SECRET_KEY, {expiresIn: '100d'})

        res.status(200).json ({ message: 'OK', role: userType, token })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

router.get('/profile', verifyToken, async (req, res) => {
    const cacheKey = `profile-${req.user.id}`;
    const cachedProfile = cache.get(cacheKey);
    if (cachedProfile) {
        return res.status(200).json(cachedProfile);
    }
    try {
        let userData = null;
        
        if (req.user.type === 'admin') {
            userData = await admin.getAdminById(req.user.id);
        } else {
            userData = await user.getUserById(req.user.id);
        }

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        cache.set(cacheKey, {
            message: 'OK',
            data: {
                id: userData.admin_id || userData.user_id,
                username: userData.name,
                email: userData.email,
                type: req.user.type
            }
        });

        res.status(200).json({
            message: 'OK',
            data: {
                id: userData.admin_id || userData.user_id,
                username: userData.name,
                email: userData.email,
                type: req.user.type
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
