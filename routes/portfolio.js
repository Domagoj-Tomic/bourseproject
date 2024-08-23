const express = require('express');
const router = express.Router();
const { getPortfolio } = require('../models/Portfolio');
const { isAuthenticated } = require('../middleware/auth');

router.get('/portfolio', isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  try {
    const portfolio = await getPortfolio(userId);
    res.render('portfolio', { portfolio });
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;