const db = require('./db');

async function inserirOcorrencia(d) {
  const [r] = await db.execute(
    `INSERT INTO tab_ocorrencia
     (titulo_ocorrencia, descricao_ocorrencia, latitude, longitude,
      localizacao, id_usuario, id_categoria)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.titulo, d.descricao, d.latitude, d.longitude,
     d.localizacao, d.idUsuario, d.idCategoria]
  );
  return r.insertId;
}

async function listarOcorrencias() {
  const [rows] = await db.execute('SELECT * FROM tab_ocorrencia');
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await db.execute(
    'SELECT * FROM tab_ocorrencia WHERE id_ocorrencia = ?', [id]);
  return rows[0];
}

async function contarConfirmacoes(id) {
  const [rows] = await db.execute(
    'SELECT COUNT(*) AS total FROM tab_confirmacoes WHERE id_ocorrencia = ?', [id]);
  return rows[0].total;
}

const STATUS_VALIDOS = ['pendente', 'em_andamento', 'resolvida', 'cancelada'];

async function atualizarStatus(id, status) {
  if (!STATUS_VALIDOS.includes(status)) {
    throw new Error('Status inválido: ' + status);
  }
  await db.execute(
    'UPDATE tab_ocorrencia SET status = ? WHERE id_ocorrencia = ?', [status, id]);
}

// Gabriel
async function listarParaMapa() {
  const [rows] = await db.execute(
    `SELECT id_ocorrencia, titulo_ocorrencia, latitude, longitude, status
     FROM tab_ocorrencia
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL`);
  return rows;
}

module.exports = {
  inserirOcorrencia,
  listarOcorrencias,
  buscarPorId,
  contarConfirmacoes,
  atualizarStatus,
  listarParaMapa,
};