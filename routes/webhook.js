const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const { updateOrderStatus } = require('../models/Order');

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      updateOrderStatus(session.id, 'completed');
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      updateOrderStatus(paymentIntent.id, 'succeeded');
      break;
    case 'payment_intent.payment_failed':
      const paymentFailedIntent = event.data.object;
      updateOrderStatus(paymentFailedIntent.id, 'failed');
      break;
    case 'invoice.payment_succeeded':
      const invoiceSucceeded = event.data.object;
      updateOrderStatus(invoiceSucceeded.id, 'succeeded');
      break;
    case 'invoice.payment_failed':
      const invoiceFailed = event.data.object;
      updateOrderStatus(invoiceFailed.id, 'failed');
      break;
    default:
      console.warn(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;