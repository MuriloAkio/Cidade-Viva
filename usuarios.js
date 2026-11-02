const db = require('./db');

async function inserirUsuario(d) {
  const [r] = await db.execute(
    `INSERT INTO tab_usuarios (nome, email, login, senha_hash, cpf, telefone, endereco)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.nome, d.email, d.login, d.senhaHash, d.cpf, d.telefone, d.endereco]
  );
  return r.insertId;
}

async function buscarUsuarioPorEmail(email) {
  const [rows] = await db.execute(
    'SELECT * FROM tab_usuarios WHERE email = ?', [email]);
  return rows[0];
}

module.exports = { inserirUsuario, buscarUsuarioPorEmail };