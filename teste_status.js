const { atualizarStatus, buscarPorId } = require('./ocorrencias');
const db = require('./db');

(async () => {
  await atualizarStatus(2, 'em_andamento');
  console.log('Status atualizado');
  console.log(await buscarPorId(2)); // alterar o valor para ver outros
  await db.end();
})();