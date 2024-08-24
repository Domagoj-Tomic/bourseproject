const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getCart, purchaseCart } = require('../models/Cart');
const { isAuthenticated } = require('../middleware/auth'); // Assuming you have an auth middleware

router.get('/checkout', isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  console.log('User ID:', userId);
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
      success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
    });

    res.render('checkout', { sessionId: session.id });
  } catch (err) {
    console.error('Error creating Stripe checkout session:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/checkout/success', isAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.query.session_id;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      await purchaseCart(userId);
      res.render('checkoutSuccess');
    } else {
      res.status(400).send('Payment not completed');
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/checkout/cancel', (req, res) => {
  res.render('checkoutCancel');
});

module.exports = router;