document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const divErro = document.getElementById('mensagem-erro');

    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();
        divErro.textContent = '';

        const dadosLogin = {
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value
        };

        try {
            const resposta = await fetch('http://192.168.18.127:5000/login', { // Use seu IP
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosLogin)
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                // Salva uma informação simples de que o usuário está logado
                localStorage.setItem('usuario_logado', JSON.stringify(resultado.usuario));
                // Redireciona para o painel principal
                window.location.href = 'dashboard.html';
            } else {
                divErro.textContent = resultado.erro || 'Erro ao tentar fazer login.';
            }
        } catch (error) {
            divErro.textContent = 'Falha de conexão com a API.';
        }
    });
});
