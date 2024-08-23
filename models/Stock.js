const pool = require('../db').pool;

const createStockTable = async () => {
  const stockTableQuery = `
    CREATE TABLE IF NOT EXISTS "stock" (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL
    );
  `;

  const priceHistoryTableQuery = `
    CREATE TABLE IF NOT EXISTS "price_history" (
      id SERIAL PRIMARY KEY,
      stock_id INTEGER REFERENCES "stock"(id),
      price NUMERIC NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(stockTableQuery);
    await pool.query(priceHistoryTableQuery);
    console.log('Stock and price history tables created or already exist');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

const addStock = async (symbol, name, price) => {
  const stockQuery = `
    INSERT INTO "stock" (symbol, name)
    VALUES ($1, $2)
    ON CONFLICT (symbol) DO UPDATE SET name = EXCLUDED.name
    RETURNING *;
  `;
  const priceHistoryQuery = `
    INSERT INTO "price_history" (stock_id, price)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [symbol, name];
  try {
    const stockRes = await pool.query(stockQuery, values);
    const stock = stockRes.rows[0];
    const priceHistoryValues = [stock.id, price];
    const priceHistoryRes = await pool.query(priceHistoryQuery, priceHistoryValues);
    console.log('Stock and price added to database:', stock, priceHistoryRes.rows[0]);
    return { stock, priceHistory: priceHistoryRes.rows[0] };
  } catch (err) {
    console.error('Error adding stock to database:', err);
    throw err;
  }
};

module.exports = {
  createStockTable,
  addStock,
};