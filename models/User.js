const pool = require('../db').pool;

const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS "user" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      passwordHash VARCHAR(100) NOT NULL,
      isAdmin BOOLEAN DEFAULT FALSE,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('User table created or already exists');
  } catch (err) {
    console.error('Error creating user table:', err);
  }
};

const addUser = async (name, email, password, isAdmin = false) => {
  const query = `
    INSERT INTO user (name, email, passwordHash, isAdmin)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [name, email, password, isAdmin];
  try {
    const res = await pool.query(query, values);
    console.log('User added to database:', res.rows[0]);
    return res.rows[0];
  } catch (err) {
    console.error('Error adding user to database:', err);
    throw err;
  }
};

const getUserByEmail = async (email) => {
  const query = 'SELECT * FROM user WHERE email = $1';
  const res = await pool.query(query, [email]);
  return res.rows[0];
};

const getUserById = async (id) => {
  const query = 'SELECT * FROM user WHERE id = $1';
  const res = await pool.query(query, [id]);
  return res.rows[0];
};

module.exports = {
  createUserTable,
  addUser,
  getUserByEmail,
  getUserById
};