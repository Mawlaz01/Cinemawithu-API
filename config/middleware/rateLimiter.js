const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    keyGenerator: (req, res) => req.ip,
    message: 'Terlalu banyak permintaan. Coba 5 menit lagi...',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = limiter;
