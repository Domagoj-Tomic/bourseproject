require('dotenv').config();
const express = require('express');
const http = require('http');
const fs = require('fs'); // File system operations
const path = require('path'); // Handling file paths
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet'); // Security middleware
const { connectDB } = require('./db');
const { createStockTable } = require('./models/Stock');
const { createUserTable } = require('./models/User');
const { createCartTable } = require('./models/Cart');
const { createPortfolioTable } = require('./models/Portfolio');
const nonceMiddleware = require('./middleware/nonce');

const app = express();
const port = process.env.PORT || 3000;

app.use(nonceMiddleware);

connectDB().then(() => {
  createUserTable().then(() => {
  }).catch(err => {
    console.error('Error during user table creation:', err);
  });

  createStockTable().then(() => {
  }).catch(err => {
    console.error('Error during stock table creation:', err);
  });

  createCartTable().then(() => {
  }).catch(err => {
    console.error('Error during cart table creation:', err);
  });
  
  createPortfolioTable().then(() => {
  }).catch(err => {
    console.error('Error during portfolio table creation:', err);
  });
}).catch(err => {
  console.error('Failed to connect to PostgreSQL', err);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  //console.log('User in session:', req.user);
  res.locals.user = req.user;
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://*.js.stripe.com", "https://js.stripe.com", "https://maps.googleapis.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://maps.googleapis.com", "https://api.openai.com"],
      frameSrc: ["'self'", "https://*.js.stripe.com", "https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// Dynamically load routes
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach(file => {
  const route = require(path.join(routesPath, file));
  app.use('/', route);
});

app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  res.status(500).json({ msg: 'Internal server error' });
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = server;