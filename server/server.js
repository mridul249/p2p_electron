const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const cors = require('cors');
const { DateTime } = require('luxon');
const cleanupInactivePeers = require('./cleanup');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = 5001;
const HOST = '192.168.157.91';

setInterval(cleanupInactivePeers, 30000);

app.post('/register', (req, res) => {
  const { username, password, ip, port } = req.body;
  if (!username || !password || !ip || !port) {
    return res.status(400).json({ message: "Missing required fields!" });
  }

  const stmt = db.prepare(
    `INSERT INTO peers (username, password, ip, port) VALUES (?, ?, ?, ?)`
  );
  stmt.run([username, password, ip, port], (err) => {
    if (err) return res.status(400).json({ message: "Username already exists!" });
    return res.json({ message: "Registration successful!" });
  });
});

app.post('/login', (req, res) => {
  const { username, password, ip, port } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials!" });
  }

  db.get(
    `SELECT username FROM peers WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ message: "DB Error" });
      if (!row) return res.status(401).json({ message: "Invalid credentials!" });
      db.run(
        `UPDATE peers SET last_seen = ?, ip = ?, port = ? WHERE username = ?`,
        [DateTime.now().toISO(), ip, port, username],
        (err2) => {
          if (err2) return res.status(500).json({ message: "DB Error" });
          return res.json({ message: "Login successful!", username: row.username });
        }
      );
    }
  );
});

app.post('/heartbeat', (req, res) => {
  const { username, ip, port } = req.body;
  if (!username || !ip || !port) {
    return res.status(400).json({ message: "Missing required fields!" });
  }

  db.run(
    `UPDATE peers SET last_heartbeat = ?, ip = ?, port = ? WHERE username = ?`,
    [DateTime.now().toISO(), ip, port, username],
    (err) => {
      if (err) return res.status(500).json({ message: "Error processing heartbeat" });
      return res.json({ message: "Heartbeat received" });
    }
  );
});

app.post('/disconnect', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: "Missing username!" });

  db.run(`DELETE FROM files WHERE username = ?`, [username], (err) => {
    if (err) return res.status(500).json({ message: "Error processing disconnect" });
    return res.json({ message: "Disconnected successfully" });
  });
});

app.get('/files', (req, res) => {
  const filename = req.query.filename || '';
  const username = req.query.username || '';
  const threshold = DateTime.now().minus({ seconds: 60 }).toISO();

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
    if (err) return res.status(500).json({ message: "DB Error" });
    return res.json({ files: rows });
  });
});

app.get('/search_files', (req, res) => {
  const filename = req.query.filename || '';
  const username = req.query.username || '';
  const threshold = DateTime.now().minus({ seconds: 60 }).toISO();

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
    if (err) return res.status(500).json({ message: "Error searching files" });
    return res.json({ files: rows });
  });
});

app.post('/share_files', (req, res) => {
  const { username, filename, peer_ip, peer_port } = req.body;
  if (!username || !filename || !peer_ip || !peer_port) {
    return res.status(400).json({ message: "Missing required fields!" });
  }

  db.run(`DELETE FROM files WHERE username = ?`, [username], (err) => {
    if (err) return res.status(500).json({ message: "Error sharing files" });

    const insertStmt = db.prepare(
      `INSERT INTO files (filename, username, peer_ip, peer_port) VALUES (?, ?, ?, ?)`
    );

    for (const f of filename) {
      insertStmt.run([f, username, peer_ip, peer_port]);
    }
    insertStmt.finalize((err2) => {
      if (err2) return res.status(500).json({ message: "Error sharing files" });
      return res.json({ message: "Files shared successfully!" });
    });
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
