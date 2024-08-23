const express = require('express');
const http = require('http'); // Required for creating an HTTP server
const fs = require('fs'); // Required for file system operations
const path = require('path'); // Required for handling file paths
const session = require('express-session');
const passport = require('passport');
const { connectDB } = require('./db'); // Import the PostgreSQL connection
const { createUserTable } = require('./models/User'); // Import the function to create user table

const app = express();
const port = process.env.PORT || 3000;

// Connect to PostgreSQL
connectDB().then(() => {
  console.log('Connected to PostgreSQL');
  // Initialize tables
  createUserTable().then(() => {
    console.log('User table creation checked');
  }).catch(err => {
    console.error('Error during user table creation:', err);
  });
}).catch(err => {
  console.error('Failed to connect to PostgreSQL', err);
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to set user in locals
app.use((req, res, next) => {
  console.log('User in session:', req.user);
  res.locals.user = req.user;
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Dynamically load routes
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach(file => {
  const route = require(path.join(routesPath, file));
  app.use('/', route);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  res.status(500).json({ msg: 'Internal server error' });
});

// Create an HTTP server
const server = http.createServer(app);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export the server for PM2
module.exports = server;