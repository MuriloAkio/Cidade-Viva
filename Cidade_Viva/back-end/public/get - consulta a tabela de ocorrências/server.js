// Importa o framework Express para criar o servidor Web e gerenciar rotas HTTP
const express = require('express');

// Importa a biblioteca do SQL Server configurada para usar o driver do Windows (msnodesqlv8)
const sql = require('mssql/msnodesqlv8');

// Inicializa a aplicação Express
const app = express();

    // Configuração com o nome exato do seu servidor (notecasa\SQLEXPRESS) e o Driver 18
    // Cria o objeto com os parâmetros de conexão
    const config = {

          // String de conexão definindo: Driver ODBC 17, servidor, banco 'cidade_viva', autenticação do Windows (Trusted_Connection) e certificado confiável
          connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=notecasa\\SQLEXPRESS;Database=cidade_viva;Trusted_Connection=yes;TrustServerCertificate=yes;'

    };

      // Cria a rota GET no endereço http://localhost:3000/colunas usando função assíncrona (async)
      app.get('/colunas', async (req, res) => {
      try {

            // Abre a conexão com o banco de dados SQL Server usando as configurações definidas em 'config'
            const pool = await sql.connect(config);

      // Prepara a requisição SQL e executa a consulta
      // Executa a consulta SQL para selecionar todos os dados da tabela 'tab_ocorrencia'
      // Declara a variável @tabela para o SQL (disponível caso queira usá-la na query)
            const result = await pool.request()
            .input('tabela', sql.VarChar, 'tab_ocorrencia')
          
            .query(`SELECT * from tab_ocorrencia`); 
            
      // Retorna o resultado obtido do banco de dados (recordset) em formato JSON para o cliente/navegador
      res.json(result.recordset);

      } 

      // Captura qualquer erro de conexão ou de execução da query e envia resposta HTTP status 500 com a mensagem de erro
      catch (err) {

            res.status(500).json({ erro: err.message });

      }

      });

// Coloca o servidor para rodar e escutar requisições na porta 3000
      app.listen(3000, () => {

            // Exibe mensagem no terminal quando o servidor estiver ativo
            console.log('Servidor rodando em http://localhost:3000/colunas');

      });