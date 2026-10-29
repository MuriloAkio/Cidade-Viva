const { inserirUsuario, buscarUsuarioPorEmail } = require('./usuarios');
const db = require('./db');

(async () => {
  try {
    const novoId = await inserirUsuario({
      nome: 'Usuario Teste',
      email: 'teste.unico@example.com', // troque para um email que ainda nao foi usado
      login: 'usuario_teste_unico',     // precisa ser unico
      senhaHash: 'HASH_DE_TESTE',       // senha teste
      cpf: null,
      telefone: null,
      endereco: null,
    });
    console.log('Usuário criado com id:', novoId);

    const usuario = await buscarUsuarioPorEmail('teste.unico@example.com');
    console.log(usuario);
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await db.end();
  }
})();