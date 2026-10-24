document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const loginInput = document.getElementById('login').value;
  const senhaInput = document.getElementById('senha').value;
  const mensagemErro = document.getElementById('mensagemErro');

  mensagemErro.innerText = '';

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginInput, senha: senhaInput })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem('id_usuario', data.id_usuario);
      window.location.href = data.redirectUrl;
    } else {
      mensagemErro.innerText = data.message || 'Login falhou.';
    }
  } catch (error) {
    mensagemErro.innerText = 'Erro ao conectar com o servidor.';
  }
});