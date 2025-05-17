var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/logout', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1] 

    if (!token) {
        return res.status(401).json({ message: 'No token provided.' })
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token Invalid' })
        }

        res.status(200).json({ message: 'Logout successful.' })
    })
})

module.exports = router;
