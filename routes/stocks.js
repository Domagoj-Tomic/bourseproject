const express = require('express');
const router = express.Router();
const axios = require('axios');
const Stock = require('../models/Stock');

// Create a new stock
router.post('/stocks', async (req, res) => {
  const { symbol, name, price } = req.body;
  try {
    let stock = new Stock({ symbol, name, price });
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get real-time stock quote
router.get('/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: {
        symbol: symbol,
        token: 'cquug01r01qvea0c7v70cquug01r01qvea0c7v7g' // Finnhub API key
      }
    });

    const { c, d, dp, h, l, o, pc } = response.data;
    res.json({ currentPrice: c, change: d, percentChange: dp, high: h, low: l, open: o, previousClose: pc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Render the stocks page
router.get('/stocks', (req, res) => {
  res.render('stocks');
});

module.exports = router;