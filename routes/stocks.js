const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db').pool;
const { addToCart, getCart, purchaseCart } = require('../models/Cart');
const { getPortfolio } = require('../models/Portfolio');

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

// Get all stocks with the most recent price
router.get('/api/stocks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.symbol, s.name, ph.price, ph.date
      FROM "stock" s
      JOIN LATERAL (
        SELECT price, date
        FROM "price_history" ph
        WHERE ph.stock_id = s.id
        ORDER BY date DESC
        LIMIT 1
      ) ph ON true
    `);
    const stocks = result.rows;
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get real-time stock quote
router.get('/api/quote', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: {
        symbol: symbol,
        token: process.env.FINNHUB_API_KEY
      }
    });

    const { c, d, dp, h, l, o, pc } = response.data;
    res.json({ currentPrice: c, change: d, percentChange: dp, high: h, low: l, open: o, previousClose: pc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add stock to cart
router.post('/api/cart', async (req, res) => {
  const { userId, stockId, quantity } = req.body;
  try {
    const cartItem = await addToCart(userId, stockId, quantity);
    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cart items
router.get('/api/cart', async (req, res) => {
  const { userId } = req.query;
  try {
    const cartItems = await getCart(userId);
    res.status(200).json(cartItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Purchase cart items
router.post('/api/cart/purchase', async (req, res) => {
  const { userId } = req.body;
  try {
    const purchasedItems = await purchaseCart(userId);
    res.redirect('/checkout');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user portfolio
router.get('/api/portfolio', async (req, res) => {
  const { userId } = req.query;
  try {
    const portfolio = await getPortfolio(userId);
    res.status(200).json(portfolio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stocks', (req, res) => {
  res.render('stocks');
});

module.exports = router;