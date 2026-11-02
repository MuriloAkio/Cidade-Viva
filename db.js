const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'SUA SENHA AQUI',
  database: 'sistema_ocorrencias',
});

module.exports = pool;