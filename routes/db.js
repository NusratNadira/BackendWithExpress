const mysql = require('mysql2');

// Create the connection pool. The pool-specific settings are the defaults
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'express_backend',
});

module.exports = db;