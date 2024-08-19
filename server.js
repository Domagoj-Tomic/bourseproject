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

// Use body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Dynamically load routes
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach(file => {
  const route = require(path.join(routesPath, file));
  app.use('/', route);
});

// // Serve static files from the React app
// app.use(express.static(path.join(__dirname, 'client/build')));

// // Catch-all handler to serve the React app for any other routes
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
// });

// Create an HTTP server
const server = http.createServer(app);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export the server for PM2
module.exports = server;