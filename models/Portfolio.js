const pool = require('../db').pool;

const createPortfolioTable = async () => {
  const portfolioTableQuery = `
    CREATE TABLE IF NOT EXISTS "portfolio" (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES "user"(id),
      stock_id INTEGER REFERENCES "stock"(id),
      quantity INTEGER NOT NULL,
      purchase_price NUMERIC NOT NULL,
      purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(portfolioTableQuery);
    console.log('Portfolio table created or already exists');
  } catch (err) {
    console.error('Error creating portfolio table:', err);
  }
};

const getPortfolio = async (userId) => {
  const portfolioQuery = `
    SELECT p.id, s.symbol, s.name, p.quantity, p.purchase_price, p.purchase_date
    FROM "portfolio" p
    JOIN "stock" s ON p.stock_id = s.id
    WHERE p.user_id = $1;
  `;
  const values = [userId];
  try {
    const portfolioRes = await pool.query(portfolioQuery, values);
    return portfolioRes.rows;
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    throw err;
  }
};

module.exports = {
  createPortfolioTable,
  getPortfolio,
};