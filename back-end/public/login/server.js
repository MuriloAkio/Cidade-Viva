// Importa o módulo express (framework web para Node.js)
const express = require('express');

// Importa o módulo mssql com o driver msnodesqlv8 (conexão SQL Server via ODBC nativo)
const sql = require('mssql/msnodesqlv8');

// Importa o módulo path (utilitário para trabalhar com caminhos de arquivos)
const path = require('path');

// Importa o módulo fs (file system - para ler/escrever arquivos)
const fs = require('fs');

// Cria a instância/aplicação do Express
const app = express();

// Middleware que permite interpretar o corpo das requisições em JSON
app.use(express.json());

// Middleware que permite interpretar o corpo das requisições em formulários (URL encoded)
app.use(express.urlencoded({ extended: true }));

// Middleware que serve arquivos estáticos da pasta "public" (HTML, CSS, JS do frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Função para salvar erros no log_erros.json
// Recebe um objeto com dados do erro e grava em um arquivo de log
    function registrarLogErro(dadosErro) {

      // Define o caminho do arquivo de log (na mesma pasta do arquivo atual)
      const caminhoLog = path.join(__dirname, 'log_erros.json');

      // Inicializa um array vazio para armazenar os logs já existentes
      let logsExistentes = [];

      // Verifica se o arquivo de log já existe no disco
      if (fs.existsSync(caminhoLog)) {

      // Bloco try/catch para evitar quebra caso o arquivo esteja corrompido
      try {

      // Lê o conteúdo do arquivo de log em formato texto (UTF-8)
      const conteudo = fs.readFileSync(caminhoLog, 'utf8');

      // Converte o texto JSON de volta para um array de objetos
      logsExistentes = JSON.parse(conteudo);

      } catch (e) {

      // Se der erro ao ler/parsear, reinicia o array vazio
      logsExistentes = [];

      }
      }

      // Cria um novo objeto de log com a data/hora atual e os dados do erro recebidos
      const novoLog = {

      // Adiciona o timestamp atual no formato ISO (ex: 2024-01-01T12:00:00.000Z)
      timestamp: new Date().toISOString(),

      // Espalha (spread) todas as propriedades do objeto dadosErro dentro do novo log
      ...dadosErro

      };

      // Adiciona o novo log ao final do array de logs existentes
      logsExistentes.push(novoLog);

      // Escreve o array atualizado de volta no arquivo, formatado com 2 espaços de indentação
      fs.writeFileSync(caminhoLog, JSON.stringify(logsExistentes, null, 2), 'utf8');

    }

// Configuração exata da sua máquina (Servidor e Driver)
// Objeto de configuração da conexão com o banco de dados SQL Server
    const dbConfig = {

      // String de conexão ODBC apontando para o servidor local SQLEXPRESS, banco cidade_viva, autenticação Windows
      connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=notecasa\\SQLEXPRESS;Database=cidade_viva;Trusted_Connection=yes;TrustServerCertificate=yes;'

    };

    // Rota de Login
    // Define uma rota POST no endpoint "/login" (usada para autenticar o usuário)
    app.post('/login', async (req, res) => {

      // Extrai "login" e "senha" do corpo da requisição enviada pelo cliente
      const { login, senha } = req.body;

      // Bloco try/catch para tratar possíveis erros de conexão ou SQL
      try {

      // Abre uma conexão (pool) com o banco de dados usando as configurações definidas
      const pool = await sql.connect(dbConfig);

      // Cria uma nova requisição no pool, define parâmetro e executa a query
      const result = await pool.request()

      // Define o parâmetro "@loginUsuario" como VARCHAR(30) com o valor recebido
      .input('loginUsuario', sql.VarChar(30), login)

      // Executa a consulta SQL buscando o usuário pelo login informado
      .query('SELECT id_usuario, nome, login, senha FROM tab_usuarios WHERE login = @loginUsuario');

      // Se nenhum registro foi retornado, significa que o login não existe
      if (result.recordset.length === 0) {

      // Retorna status 401 (não autorizado) com mensagem genérica de erro
      return res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });

      }

      // Pega o primeiro (e único) usuário retornado pela consulta
      const usuario = result.recordset[0];

      // Valida a senha digitada com a cadastrada no banco
      // Compara a senha recebida do formulário com a senha armazenada no banco
      if (usuario.senha === senha) {

      // Se a senha está correta, retorna sucesso e a URL de redirecionamento
      return res.json({ 

      // Indica que o login foi bem-sucedido
      success: true, 

      // URL para onde o frontend deve redirecionar após o login
      redirectUrl: '/ocorrencia.html',

      // Envia o ID do usuário autenticado para uso posterior no frontend
      id_usuario: usuario.id_usuario

      }
        
      );

      }


      else {

        // Se a senha está errada, retorna status 401 com a mesma mensagem genérica
        return res.status(401).json({ success: false, message: 'Usuário ou senha incorretos.' });

      }

      }

      // Captura qualquer erro que aconteça durante a conexão ou execução da query
      catch (err) {

        // Exibe no console do servidor a mensagem do erro (útil para debug)
        console.error('Erro de conexão/SQL:', err.message);

        // Registra o erro no arquivo log_erros.json
        registrarLogErro({

        // Indica qual rota gerou o erro
        rota: '/login',

        // Indica o método HTTP utilizado
        metodo: 'POST',

        // Mensagem do erro ocorrido
        mensagem: err.message,

        // Stack trace (rastreamento) do erro para diagnóstico detalhado
        stack: err.stack

        });

        // Retorna status 500 (erro interno) informando que houve erro no banco de dados
        return res.status(500).json({ success: false, message: 'Erro no banco de dados. Verifique o arquivo log_erros.json.' });

    }
      }
        );

      // Inicia o servidor na porta 3000
      app.listen(3000, () => {

        // Exibe mensagem no console confirmando que o servidor está rodando
        console.log('Servidor rodando em http://localhost:3000');

      });
