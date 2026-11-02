const { inserirOcorrencia } = require('./ocorrencias');
const db = require('./db');

(async () => {
  try {
    const novoId = await inserirOcorrencia({
      titulo: 'Teste de inserção',
      descricao: 'Registro criado pelo teste_inserir.js',
      latitude: -23.5510000,
      longitude: -46.6340000,
      localizacao: 'Rua de teste, 1',
      idUsuario: 1,    // usuário Ana Souza 
      idCategoria: 1,  // categoria vbias publicas ja existe
    });
    console.log('Novo id criado:', novoId);
  } catch (err) {
    console.error('Erro ao inserir:', err);
  } finally {
    await db.end(); // fecha a conexao, para o script terminar sozinho
  }
})();