const mysql = require('mysql2');
const {PrismaClient} = require('@prisma/client')
// Create the connection pool. The pool-specific settings are the defaults
// const db = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'express_backend',
// });



const db = new PrismaClient();

module.exports = db;