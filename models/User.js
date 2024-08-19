const pool = require('../db').pool;

const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      isAdmin BOOLEAN DEFAULT FALSE,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('Users table created or already exists');
  } catch (err) {
    console.error('Error creating users table:', err);
  }
};

const addUser = async (name, email, password, isAdmin = false) => {
  const query = `
    INSERT INTO users (name, email, password, isAdmin)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [name, email, password, isAdmin];
  const res = await pool.query(query, values);
  return res.rows[0];
};

const getUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const res = await pool.query(query, [email]);
  return res.rows[0];
};

const getUserById = async (id) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  const res = await pool.query(query, [id]);
  return res.rows[0];
};

module.exports = {
  createUserTable,
  addUser,
  getUserByEmail,
  getUserById
};