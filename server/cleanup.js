const db = require('./db');
const { DateTime } = require('luxon');

function cleanupInactivePeers() {
  const threshold = DateTime.now().minus({ seconds: 60 }).toISO();
  db.serialize(() => {
    db.all(
      `SELECT username FROM peers WHERE last_heartbeat < ?`,
      [threshold],
      (err, rows) => {
        if (!err && rows && rows.length > 0) {
          rows.forEach(peer => {
            const username = peer.username;
            db.run(`DELETE FROM files WHERE username = ?`, [username]);
            db.run(`DELETE FROM peers WHERE username = ?`, [username]);
          });
        }
      }
    );
  });
}

module.exports = cleanupInactivePeers;
