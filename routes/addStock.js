const express = require('express');
const router = express.Router();
const axios = require('axios');
const { addStock } = require('../models/Stock');
function isAdmin(req, res, next) {
    if (req.user && req.user.isAdmin) {
        return next();
    } else {
        res.status(403).send('Access denied');
    }
}

router.get('/addStock', isAdmin, (req, res) => {
    res.render('addStock');
});

router.post('/addStock', isAdmin, async (req, res) => {
    const { symbol, name } = req.body;
    try {
        const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
            params: {
                symbol: symbol,
                token: process.env.FINNHUB_API_KEY
            }
        });

        console.log('API response:', response.data);

        const { c: price } = response.data;

        if (!price) {
            console.error('Unable to fetch stock price:', response.data);
            return res.status(400).json({ error: 'Unable to fetch stock price' });
        }

        const result = await addStock(symbol, name, price);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error adding stock:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;