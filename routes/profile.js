const express = require('express');
const router = express.Router();

// Render the profile page
router.get('/profile', (req, res) => {
  res.render('profile');
});

module.exports = router;