const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'p2p.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS peers (
      username TEXT PRIMARY KEY,
      password TEXT,
      ip TEXT,
      port INTEGER,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      filename TEXT,
      username TEXT,
      peer_ip TEXT,
      peer_port INTEGER,
      shared_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(username) REFERENCES peers(username)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_filename ON files(filename)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_username ON files(username)`);
});

module.exports = db;
