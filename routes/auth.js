const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { addUser } = require('../models/User');

// Initialize Passport
require('../passportConfig');

// Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  //console.log('Register request received:', req.body);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await addUser(username, email, hashedPassword);
    //console.log('User created:', user);
    res.redirect('/auth?success=1');
  } catch (err) {
    console.error('Error during registration:', err.message);
    let errorMsg = 'Server error';
    if (err.message === 'Email already exists') {
      errorMsg = 'Email already exists';
    }
    res.render('auth', { error: errorMsg });
  }
});

// Login a user
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) {
        console.error('Authentication error:', err);
        return res.render('auth', { error: 'Server error' });
    }
    if (!user) {
        return res.render('auth', { error: 'Invalid credentials' });
    }
    req.logIn(user, (err) => {
        if (err) {
            console.error('Login error:', err);
            return res.render('auth', { error: 'Server error' });
        }
        res.redirect('/');
    });
  })(req, res, next);
});

router.get('/auth', (req, res) => {
    res.render('auth');
});

module.exports = router;