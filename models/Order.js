const db = require('../db');

async function updateOrderStatus(sessionId, status) {
  try {
    const result = await db.query('UPDATE orders SET status = $1 WHERE session_id = $2', [status, sessionId]);
    return result.rowCount > 0;
  } catch (err) {
    console.error('Error updating order status:', err);
    throw err;
  }
}

module.exports = {
  updateOrderStatus,
};