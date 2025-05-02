const express = require('express')
const router = express.Router()
const filmModel = require('../../model/filmModel')
const { verifyToken, authorize } = require('../../config/middleware/jwt')



module.exports = router
