// app.js - VERSÃO COMPLETA E REVISADA

// Função para carregar os clientes da API e preencher a tabela
async function carregarClientes() {
    const tabelaCorpo = document.getElementById('tabela-clientes-corpo');
    
    // Adiciona a coluna "Ações" ao cabeçalho da tabela (se ainda não existir)
    const cabecalho = document.querySelector("#tabela-clientes-corpo").parentNode.querySelector("thead tr");
    if (cabecalho.cells.length < 7) {
         cabecalho.innerHTML += '<th>Ações</th>';
    }
    
    tabelaCorpo.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

    try {
        const resposta = await fetch('http://192.168.18.127:5000/clientes'); // Use seu IP
        if (!resposta.ok) {
            throw new Error('Falha ao buscar clientes da API.');
        }
        const clientes = await resposta.json();

        tabelaCorpo.innerHTML = '';

        if (clientes.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="7">Nenhum cliente cadastrado.</td></tr>';
            return;
        }

        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.id}</td>
                <td>${cliente.nome_completo}</td>
                <td>${cliente.cpf}</td>
                <td>${cliente.login_pppoe}</td>
                <td>${cliente.nome_plano || 'N/A'}</td>
                <td>${cliente.status}</td>
                <td>
                    <button class="btn-editar" data-id="${cliente.id}">Editar</button>
                    <button class="btn-excluir" data-id="${cliente.id}">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        tabelaCorpo.innerHTML = '<tr><td colspan="7" style="color: red;">Erro ao carregar a lista.</td></tr>';
    }
}

// Função para preparar o formulário para edição (COM DEBUG)
async function prepararEdicao(id) {
    try {
        const resposta = await fetch(`http://192.168.18.127:5000/clientes/${id}`); // Use seu IP

        // Linhas de debug para ver a resposta do servidor
        console.log('Objeto da resposta completa:', resposta);
        const textoDaResposta = await resposta.text();
        console.log('Corpo da resposta como texto:', textoDaResposta);

        const cliente = JSON.parse(textoDaResposta);

        // Preenche o formulário com os dados
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('nome').value = cliente.nome_completo;
        document.getElementById('cpf').value = cliente.cpf;
        document.getElementById('endereco').value = cliente.endereco;
        document.getElementById('login').value = cliente.login_pppoe;
        document.getElementById('senha').value = cliente.senha_pppoe;

        document.querySelector("#form-cliente button").textContent = 'Salvar Alterações';
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Ocorreu um erro detalhado na função prepararEdicao:', error);
        alert('Erro ao buscar dados do cliente para edição. Verifique o console (F12).');
    }
}

// Função para limpar o formulário e resetar o modo de edição
function resetarFormulario() {
    document.getElementById('form-cliente').reset();
    document.getElementById('cliente-id').value = '';
    document.querySelector("#form-cliente button").textContent = 'Cadastrar Cliente';
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    const formCliente = document.getElementById('form-cliente');
    const divResposta = document.getElementById('mensagem-resposta');
    const btnAtualizar = document.getElementById('btn-atualizar');
    const tabelaCorpo = document.getElementById('tabela-clientes-corpo');

    // LÓGICA DE CADASTRO E EDIÇÃO
    formCliente.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('cliente-id').value;
        const url = id ? `http://192.168.18.127:5000/clientes/${id}` : `http://192.168.18.127:5000/clientes`;
        const method = id ? 'PUT' : 'POST';

        const dadosCliente = {
            nome_completo: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            endereco: document.getElementById('endereco').value,
            login_pppoe: document.getElementById('login').value,
            senha_pppoe: document.getElementById('senha').value,
            plano_id: 1
        };

        try {
            const resposta = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCliente)
            });
            const resultado = await resposta.json();
            if (resposta.ok) {
                divResposta.innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                resetarFormulario();
                carregarClientes();
            } else {
                divResposta.innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`;
            }
        } catch (error) {
            divResposta.innerHTML = `<p style="color: red;">Não foi possível conectar à API.</p>`;
        }
    });

    // LÓGICA DE CLIQUE NA TABELA (DELEÇÃO E EDIÇÃO)
    tabelaCorpo.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-excluir')) {
            const id = event.target.dataset.id;
            if (confirm(`Tem certeza que deseja excluir o cliente com ID ${id}?`)) {
                try {
                    const resposta = await fetch(`http://192.168.18.127:5000/clientes/${id}`, { method: 'DELETE' });
                    if (resposta.ok) { carregarClientes(); } else { alert('Erro ao excluir.'); }
                } catch (error) { alert('Falha de conexão.'); }
            }
        } else if (event.target.classList.contains('btn-editar')) {
            const id = event.target.dataset.id;
            prepararEdicao(id);
        }
    });

    // LÓGICA DE LISTAGEM
    btnAtualizar.addEventListener('click', carregarClientes);
    // Carrega a lista de clientes assim que a página é aberta
    carregarClientes();
});
