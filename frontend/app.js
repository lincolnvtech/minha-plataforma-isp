// app.js - VERSÃO COMPLETA E CORRETA

// Função para buscar os clientes da API e preencher a tabela
async function carregarClientes() {
    const tabelaCorpo = document.getElementById('tabela-clientes-corpo');
    
    // Limpa a tabela antes de carregar novos dados
    tabelaCorpo.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';

    try {
        const resposta = await fetch('http://192.168.18.127:5000/clientes'); // Use o IP correto do seu servidor
        if (!resposta.ok) {
            throw new Error('Falha ao buscar clientes da API.');
        }
        const clientes = await resposta.json();

        // Limpa a mensagem "Carregando..."
        tabelaCorpo.innerHTML = '';

        if (clientes.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="6">Nenhum cliente cadastrado.</td></tr>';
            return;
        }

        // Para cada cliente na lista, cria uma nova linha na tabela
        clientes.forEach(cliente => {
            const tr = document.createElement('tr'); // Cria uma linha <tr>
            tr.innerHTML = `
                <td>${cliente.id}</td>
                <td>${cliente.nome_completo}</td>
                <td>${cliente.cpf}</td>
                <td>${cliente.login_pppoe}</td>
                <td>${cliente.nome_plano || 'N/A'}</td>
                <td>${cliente.status}</td>
            `;
            tabelaCorpo.appendChild(tr); // Adiciona a nova linha ao corpo da tabela
        });

    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="color: red;">Erro ao carregar a lista.</td></tr>';
    }
}


// Espera o HTML ser totalmente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE CADASTRO ---
    const formCliente = document.getElementById('form-cliente');
    const divResposta = document.getElementById('mensagem-resposta');

    formCliente.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dadosCliente = {
            nome_completo: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            endereco: document.getElementById('endereco').value,
            plano_id: 1,
            login_pppoe: document.getElementById('login').value,
            senha_pppoe: document.getElementById('senha').value
        };

        try {
            const resposta = await fetch('http://192.168.18.127:5000/clientes', { // Use o IP correto
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCliente)
            });

            const resultado = await resposta.json();

            if (resposta.ok) {
                divResposta.innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                formCliente.reset();
                // ESTA É A LINHA QUE ESTAVA FALTANDO E QUE RESOLVE O PROBLEMA
                carregarClientes(); 
            } else {
                divResposta.innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`;
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            divResposta.innerHTML = `<p style="color: red;">Não foi possível conectar à API.</p>`;
        }
    });

    // --- LÓGICA DE LISTAGEM ---
    const btnAtualizar = document.getElementById('btn-atualizar');
    btnAtualizar.addEventListener('click', carregarClientes);

    // Carrega a lista de clientes assim que a página é aberta pela primeira vez
    carregarClientes();
});
