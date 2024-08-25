const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db').pool;
const { addToCart, getCart, purchaseCart } = require('../models/Cart');
const { getPortfolio } = require('../models/Portfolio');
const { isAuthenticated } = require('../middleware/auth');
const nonceMiddleware = require('../middleware/nonce');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
router.post('/api/cart', isAuthenticated, async (req, res) => {
  const { stockId, quantity } = req.body;
  const userId = req.user.id;
  try {
    const cartItem = await addToCart(userId, stockId, quantity);
    res.status(201).json(cartItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cart items
router.get('/api/cart', isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  try {
    const cartItems = await getCart(userId);
    res.status(200).json(cartItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Purchase cart items
router.post('/api/cart/purchase', isAuthenticated, async (req, res) => {
    const userId = req.user.id;
    try {
        console.log(`User ID: ${userId}`);
        const cartItems = await getCart(userId);
        console.log(`Cart Items: ${JSON.stringify(cartItems)}`);

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ error: 'No items in cart' });
        }

        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100), // Stripe expects the amount in cents
            },
            quantity: item.quantity,
        }));

        console.log(`Line Items: ${JSON.stringify(lineItems)}`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
        });

        console.log(`Stripe Session: ${JSON.stringify(session)}`);

        res.status(200).json({ success: true, redirectUrl: session.url });
    } catch (err) {
        console.error('Error purchasing cart:', err);
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

router.get('/stocks', isAuthenticated, nonceMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).send('User not authenticated');
  }
  res.render('stocks', { user: req.user, nonce: res.locals.nonce });
});

module.exports = router;