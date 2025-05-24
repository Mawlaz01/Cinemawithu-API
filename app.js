var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var session = require('express-session')
const cors = require('cors')
const { onlyDomain } = require('./config/middleware/corsOptions')

var indexRouter = require('./routes/index')

// var auth
var registerRouter = require('./routes/auth/register')
var loginRouter = require('./routes/auth/login')
var logoutRouter = require('./routes/auth/logout')

// var admin
var filmRouter = require('./routes/admin/film')
var seatRouter = require('./routes/admin/seat')
var showtimeRouter = require('./routes/admin/showtime')
var theaterRouter = require('./routes/admin/theater')

// var user
var dashboardRouter = require('./routes/user/dashboard')
var detailfilmRouter = require('./routes/user/detailfilm')

var app = express()

var dotenv = require('dotenv')
dotenv.config()
const port = process.env.PORT
app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use('/static', express.static(path.join(__dirname, 'public/images')))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// Setup session
app.use(session({
  secret: 'rahasia_kunci_session',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // ubah jadi true kalau pakai HTTPS
}))

app.use('/API', indexRouter)

// app auth 
app.use('/API', registerRouter)
app.use('/API', loginRouter)
app.use('/API', logoutRouter)

// app admin
app.use('/API', filmRouter)
app.use('/API', seatRouter)
app.use('/API', showtimeRouter)
app.use('/API', theaterRouter)
app.use('/images', express.static('public/images'));

// app user
app.use('/API', dashboardRouter)
app.use('/API', detailfilmRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
