const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getCart } = require('../models/Cart');
const { isAuthenticated } = require('../middleware/auth'); // Assuming you have an auth middleware

router.get('/checkout', isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const cartItems = await getCart(userId);

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).send('No items in cart');
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

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
    });

    res.render('checkout', { sessionId: session.id });
  } catch (err) {
    console.error('Error creating Stripe checkout session:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/checkout/success', (req, res) => {
  res.render('checkoutSuccess');
});

router.get('/checkout/cancel', (req, res) => {
  res.render('checkoutCancel');
});

module.exports = router;