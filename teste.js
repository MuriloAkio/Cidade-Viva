const { contarConfirmacoes } = require('./ocorrencias');
const db = require('./db');

(async () => {
  console.log(await contarConfirmacoes(1));
  await db.end();
})();

/* Para testar outras funções:
   1. troque o nome na linha do require
   2. troque o nome dentro do console.log
   Se a função pedir um valor (ex.: id), coloque-o entre parênteses. 
   listarOcorrencias - contarConfirmacoes - listarParaMapa */