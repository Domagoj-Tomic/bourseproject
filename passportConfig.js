const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

passport.use(new LocalStrategy({
  usernameField: 'identifier',
  passwordField: 'password'
}, async (identifier, password, done) => {
  try {
    const res = await pool.query(
      'SELECT * FROM "user" WHERE "email" = $1 OR "username" = $1', 
      [identifier]
    );
    const user = res.rows[0];
    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    return done(null, user);
  } catch (err) {
    console.error('Database query error:', err);
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query('SELECT * FROM "user" WHERE id = $1', [id]);
    const user = res.rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});