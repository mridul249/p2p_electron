// server/db.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'p2p.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS peers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      ip TEXT,
      port INTEGER,
      last_seen TEXT,
      last_heartbeat TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      username TEXT,
      peer_ip TEXT,
      peer_port INTEGER,
      shared_time TEXT
    )
  `);
});

module.exports = db;
