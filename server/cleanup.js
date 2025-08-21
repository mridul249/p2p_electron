// server/cleanup.js

const db = require('./db');
const { DateTime } = require('luxon');

function cleanupInactivePeers() {
  // const threshold = DateTime.now().minus({ seconds: 60 }).toISO();
  // console.log(`Cleaning up peers not seen since ${threshold}`);

  // db.run(
  //   `DELETE FROM peers WHERE last_heartbeat < ?`,
  //   [threshold],
  //   function(err) {
  //     if (err) {
  //       console.error('Error during cleanup:', err);
  //     } else {
  //       console.log(`Cleanup complete. ${this.changes} peers removed.`);
  //       db.run(`DELETE FROM files WHERE username NOT IN (SELECT username FROM peers)`, [], function(err2) {
  //         if (err2) {
  //           console.error('Error deleting files from inactive peers:', err2);
  //         } else {
  //           console.log(`Deleted files from inactive peers. ${this.changes} files removed.`);
  //         }
  //       });
  //     }
  //   }
  // );
}

module.exports = cleanupInactivePeers;
