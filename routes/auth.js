const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { addUser } = require('../models/User');

// Initialize Passport
require('../passportConfig');

// Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password, isAdmin } = req.body;
  console.log('Register request received:', req.body);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await addUser(username, email, hashedPassword, isAdmin);
    console.log('User created:', user);
    res.status(201).json(user);
  } catch (err) {
    console.error('Error during registration:', err.message);
    if (err.message === 'Email already exists') {
      return res.status(400).json({ msg: 'Email already exists' });
    }
    res.status(500).send('Server error');
  }
});

// Login a user
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) {
        console.error('Authentication error:', err);
        return next(err);
    }
    if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
    }
    req.logIn(user, (err) => {
        if (err) {
            console.error('Login error:', err);
            return next(err);
      }
      res.json({ msg: 'Login successful' });
    });
  })(req, res, next);
});

router.get('/auth', (req, res) => {
    res.render('auth');
});

module.exports = router;