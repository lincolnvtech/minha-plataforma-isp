document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const divErro = document.getElementById('mensagem-erro');
    const API_BASE_URL = '/api'; // Rota relativa para a API

    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();
        divErro.textContent = '';
        const dadosLogin = {
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value
        };
        try {
            const resposta = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosLogin)
            });
            const resultado = await resposta.json();
            if (resposta.ok) {
                localStorage.setItem('usuario_logado', JSON.stringify(resultado.usuario));
                window.location.href = '/dashboard';
            } else {
                divErro.textContent = resultado.erro || 'Erro ao tentar fazer login.';
            }
        } catch (error) {
            divErro.textContent = 'Falha de conexão com a API.';
        }
    });
});
