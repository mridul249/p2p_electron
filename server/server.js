// server/server.js

require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const cors = require('cors');
const { DateTime } = require('luxon');
const cleanupInactivePeers = require('./cleanup');
const app = express();
app.use(bodyParser.json());
// Enhanced CORS configuration for cross-origin requests
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Server configuration: listen on all interfaces by default; allow overrides via env
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
const HOST = process.env.HOST || '0.0.0.0';

setInterval(cleanupInactivePeers, 30000);

// Health check endpoint for debugging connectivity
app.get('/health', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  console.log(`Health check from IP: ${clientIP}`);
  res.json({ 
    status: 'ok', 
    server_time: new Date().toISOString(),
    client_ip: clientIP,
    server_host: HOST,
    server_port: PORT
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${clientIP}`);
  next();
});

app.post('/register', (req, res) => {
  const { username, password, ip, port } = req.body;
  console.log(`Register attempt for user: ${username}`);
  
  if (!username || !password || !ip || !port) {
    console.log('Missing required fields for registration.');
    return res.status(400).json({ message: "Missing required fields!" });
  }

  const stmt = db.prepare(
    `INSERT INTO peers (username, password, ip, port, last_seen, last_heartbeat) VALUES (?, ?, ?, ?, ?, ?)`
  );
  stmt.run([username, password, ip, port, DateTime.now().toISO(), DateTime.now().toISO()], (err) => {
    if (err) {
      console.error('Registration error:', err);
      return res.status(400).json({ message: "Username already exists!" });
    }
    console.log(`Registration successful for user: ${username}`);
    return res.json({ message: "Registration successful!" });
  });
});

app.post('/login', (req, res) => {
  const { username, password, ip, port } = req.body;
  console.log(`Login attempt for user: ${username}`);
  
  if (!username || !password) {
    console.log('Missing credentials');
    return res.status(400).json({ message: "Missing credentials!" });
  }

  db.get(
    `SELECT username FROM peers WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) {
        console.error('DB Error during login:', err);
        return res.status(500).json({ message: "DB Error" });
      }
      if (!row) {
        console.log('Invalid credentials for user:', username);
        return res.status(401).json({ message: "Invalid credentials!" });
      }
      db.run(
        `UPDATE peers SET last_seen = ?, ip = ?, port = ?, last_heartbeat = ? WHERE username = ?`,
        [DateTime.now().toISO(), ip, port, DateTime.now().toISO(), username],
        (err2) => {
          if (err2) {
            console.error('DB Update Error during login:', err2);
            return res.status(500).json({ message: "DB Error" });
          }
          console.log(`Login successful for user: ${username}`);
          return res.json({ message: "Login successful!", username: row.username });
        }
      );
    }
  );
});

app.post('/heartbeat', (req, res) => {
  const { username, ip, port } = req.body;
  console.log(`Heartbeat from user: ${username}`);
  
  if (!username || !ip || !port) {
    console.log('Missing required fields for heartbeat.');
    return res.status(400).json({ message: "Missing required fields!" });
  }

  db.run(
    `UPDATE peers SET last_heartbeat = ?, ip = ?, port = ? WHERE username = ?`,
    [DateTime.now().toISO(), ip, port, username],
    (err) => {
      if (err) {
        console.error('Error processing heartbeat:', err);
        return res.status(500).json({ message: "Error processing heartbeat" });
      }
      console.log(`Heartbeat received from user: ${username}`);
      return res.json({ message: "Heartbeat received" });
    }
  );
});

app.post('/disconnect', (req, res) => {
  const { username } = req.body;
  console.log(`Disconnect request from user: ${username}`);
  
  if (!username) {
    console.log('Missing username in disconnect request.');
    return res.status(400).json({ message: "Missing username!" });
  }

  db.run(`DELETE FROM files WHERE username = ?`, [username], (err) => {
    if (err) {
      console.error('Error deleting shared files on disconnect:', err);
      return res.status(500).json({ message: "Error processing disconnect" });
    }
    db.run(`DELETE FROM peers WHERE username = ?`, [username], (err2) => {
      if (err2) {
        console.error('Error deleting peer on disconnect:', err2);
        return res.status(500).json({ message: "Error processing disconnect" });
      }
      console.log(`Disconnected user: ${username}`);
      return res.json({ message: "Disconnected successfully" });
    });
  });
});

app.get('/files', (req, res) => {
  const filename = req.query.filename || '';
  const username = req.query.username || '';
  const threshold = DateTime.now().minus({ seconds: 60 }).toISO();

  console.log(`Files request: filename='${filename}', username='${username}'`);

  let query = `
    SELECT files.filename, files.username, files.peer_ip, files.peer_port, files.shared_time
    FROM files
    JOIN peers ON files.username = peers.username
    WHERE peers.last_heartbeat >= ?
  `;
  const params = [threshold];
  if (filename) {
    query += ` AND files.filename LIKE ?`;
    params.push(`%${filename}%`);
  }
  if (username) {
    query += ` AND files.username LIKE ?`;
    params.push(`%${username}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('DB Error fetching files:', err);
      return res.status(500).json({ message: "DB Error" });
    }
    console.log(`Files fetched: ${rows.length} files`);
    return res.json({ files: rows });
  });
});

app.get('/search_files', (req, res) => {
  const filename = req.query.filename || '';
  const username = req.query.username || '';
  const threshold = DateTime.now().minus({ seconds: 60 }).toISO();

  console.log(`Search files request: filename='${filename}', username='${username}'`);

  let query = `
    SELECT files.filename, files.username, files.peer_ip, files.peer_port, files.shared_time
    FROM files
    JOIN peers ON files.username = peers.username
    WHERE peers.last_heartbeat >= ?
  `;
  const params = [threshold];
  if (filename) {
    query += ` AND files.filename LIKE ?`;
    params.push(`%${filename}%`);
  }
  if (username) {
    query += ` AND files.username LIKE ?`;
    params.push(`%${username}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('DB Error searching files:', err);
      return res.status(500).json({ message: "Error searching files" });
    }
    console.log(`Search files result: ${rows.length} files`);
    return res.json({ files: rows });
  });
});

app.post('/share_files', (req, res) => {
  const { username, filename, peer_ip, peer_port } = req.body;
  console.log(`Share files from ${username}:`, filename, peer_ip, peer_port);
  
  if (!username || !filename || !peer_ip || !peer_port) {
    console.log('Missing required fields for share_files.');
    return res.status(400).json({ message: "Missing required fields!" });
  }

  db.run(`DELETE FROM files WHERE username = ?`, [username], (err) => {
    if (err) {
      console.error('Error deleting old shared files:', err);
      return res.status(500).json({ message: "Error sharing files" });
    }

    const insertStmt = db.prepare(
      `INSERT INTO files (filename, username, peer_ip, peer_port, shared_time) VALUES (?, ?, ?, ?, ?)`
    );

    for (const f of filename) {
      insertStmt.run([f, username, peer_ip, peer_port, DateTime.now().toISO()]);
      console.log(`Shared file: ${f}`);
    }
    insertStmt.finalize((err2) => {
      if (err2) {
        console.error('Error inserting shared files:', err2);
        return res.status(500).json({ message: "Error sharing files" });
      }
      console.log(`Files shared successfully by user: ${username}`);
      return res.json({ message: "Files shared successfully!" });
    });
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
