var jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer', '').trim()
    if (!token) {
        return res.status(403).json({ message: 'No token provided'})
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'invalid or expired token'})
        }
        req.user = decoded
        next()
    })
}

function authorize(AllowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json ({ message: 'User not authentacated'})
        }
        if (!AllowedRoles.includes(req.user.type)) {
            return res.status(403).json ({ message: 'Acess denied: You do not have premission'}) 
        }
        next()
    }
}

module.exports = {verifyToken, authorize}