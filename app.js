require('./models/User');
require('./models/Tweet');
require('./config/passport');

const passport = require('passport');
const express = require("express");
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const debug = require('debug')('backend:error');
const cors = require('cors');
const csurf = require('csurf');
const { isProduction } = require('./config/keys');

const usersRouter = require('./routes/api/users');
const tweetsRouter = require('./routes/api/tweets');
const csrfRouter = require('./routes/api/csrf');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());

// Security Middleware
if (!isProduction) {
  // Enable CORS only in development because React will be on the React
  // development server (http://localhost:5173). (In production, React files
  // will be served statically on the Express server.)
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
}

// Set the _csrf token and create req.csrfToken method to generate a hashed CSRF token
app.use(
  csurf({
    cookie: {
      secure: isProduction,
      sameSite: isProduction && "Lax",
      httpOnly: true
    }
  })
);

// Attach Express routers
app.use('/api/users', usersRouter);
app.use('/api/tweets', tweetsRouter);
app.use('/api/csrf', csrfRouter);

app.get('/api/get-csrf-token', (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.statusCode = 404;
  next(err);
});

// Express custom error handler
app.use((err, req, res, next) => {
  debug(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    statusCode,
    errors: err.errors || {}
  });
});

module.exports = app;