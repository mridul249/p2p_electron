CREATE TABLE IF NOT EXISTS peers (
    username TEXT PRIMARY KEY,
    password TEXT,
    ip TEXT,
    port INTEGER,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
    filename TEXT,
    username TEXT,
    peer_ip TEXT,
    peer_port INTEGER,
    shared_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(username) REFERENCES peers(username)
);

CREATE INDEX IF NOT EXISTS idx_filename ON files(filename);
CREATE INDEX IF NOT EXISTS idx_username ON files(username);
