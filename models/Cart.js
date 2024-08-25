const pool = require('../db').pool;
const { addStock } = require('../models/Stock');
const axios = require('axios');

const createCartTable = async () => {
  const cartTableQuery = `
    CREATE TABLE IF NOT EXISTS "cart" (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES "user"(id),
      stock_id INTEGER REFERENCES "stock"(id),
      quantity INTEGER NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(cartTableQuery);
    console.log('Cart table created or already exists');
  } catch (err) {
    console.error('Error creating cart table:', err);
  }
};

const addToCart = async (userId, stockId, quantity) => {
  const cartQuery = `
    INSERT INTO "cart" (user_id, stock_id, quantity)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [userId, stockId, quantity];
  try {
    const cartRes = await pool.query(cartQuery, values);
    return cartRes.rows[0];
  } catch (err) {
    console.error('Error adding to cart:', err);
    throw err;
  }
};

const getCart = async (userId) => {
  const cartQuery = `
    SELECT c.id, s.symbol, s.name, c.quantity, ph.price, c.added_at
    FROM "cart" c
    JOIN "stock" s ON c.stock_id = s.id
    JOIN LATERAL (
      SELECT price
      FROM "price_history" ph
      WHERE ph.stock_id = s.id
      ORDER BY date DESC
      LIMIT 1
    ) ph ON true
    WHERE c.user_id = $1;
  `;
  const values = [userId];
  try {
    const cartRes = await pool.query(cartQuery, values);
    return cartRes.rows;
  } catch (err) {
    console.error('Error fetching cart:', err);
    throw err;
  }
};

const purchaseCart = async (userId) => {
  try {
    const cartItems = await getCart(userId);
    for (const item of cartItems) {
      // Fetch the current price from the API
      const response = await axios.get(`${process.env.BASE_URL}/api/quote`, {
        params: { symbol: item.symbol }
      });
      const currentPrice = response.data.currentPrice;

      // Add the stock and its current price to the database
      await addStock(item.symbol, item.name, currentPrice);

      // Insert the stock into the user's portfolio
      const portfolioQuery = `
        INSERT INTO "portfolio" (user_id, stock_id, quantity, purchase_price, purchase_date)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;
      const portfolioValues = [userId, item.stock_id, item.quantity, currentPrice];
      await pool.query(portfolioQuery, portfolioValues);
    }

    // Empty the cart after purchase
    const emptyCartQuery = 'DELETE FROM "cart" WHERE user_id = $1';
    await pool.query(emptyCartQuery, [userId]);

    return cartItems;
  } catch (err) {
    console.error('Error purchasing cart:', err);
    throw err;
  }
};

const emptyCart = async (userId) => {
  try {
    const emptyCartQuery = 'DELETE FROM "cart" WHERE user_id = $1';
    await pool.query(emptyCartQuery, [userId]);
  } catch (err) {
    console.error('Error emptying cart:', err);
    throw err;
  }
};

module.exports = {
  createCartTable,
  addToCart,
  getCart,
  purchaseCart,
  emptyCart,
};