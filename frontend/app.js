// Espera o HTML ser totalmente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // Pega a referência do formulário e do botão pelo ID que definimos no HTML
    const formCliente = document.getElementById('form-cliente');
    const divResposta = document.getElementById('mensagem-resposta');

    // Adiciona um "ouvinte" de evento para quando o formulário for enviado (clique no botão)
    formCliente.addEventListener('submit', async (event) => {
        // Impede o comportamento padrão do formulário, que é recarregar a página
        event.preventDefault();

        // 1. Coleta os dados dos campos do formulário
        const dadosCliente = {
            nome_completo: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            endereco: document.getElementById('endereco').value,
            plano_id: 1, // Por enquanto, vamos fixar o plano_id como 1
            login_pppoe: document.getElementById('login').value,
            senha_pppoe: document.getElementById('senha').value
        };

        // 2. Envia os dados para a API Flask usando a API Fetch
        try {
            const resposta = await fetch('http://192.168.18.127:5000/clientes', {
                method: 'POST', // O método tem que ser POST, como no curl
                headers: {
                    'Content-Type': 'application/json' // Avisa a API que estamos enviando JSON
                },
                body: JSON.stringify(dadosCliente) // Converte o objeto JavaScript em texto JSON
            });

            const resultado = await resposta.json(); // Pega a resposta da API

            // 3. Exibe a resposta para o usuário
            if (resposta.ok) {
                // Se a resposta foi bem-sucedida (status 2xx)
                divResposta.innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                formCliente.reset(); // Limpa o formulário
            } else {
                // Se a API retornou um erro (status 4xx ou 5xx)
                divResposta.innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`;
            }
        } catch (error) {
            // Se houve um erro de rede (API offline, etc)
            console.error('Erro de rede:', error);
            divResposta.innerHTML = `<p style="color: red;">Não foi possível conectar à API.</p>`;
        }
    });
});
