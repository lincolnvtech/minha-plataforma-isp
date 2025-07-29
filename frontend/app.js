// app.js - VERSÃO COM CRUD DE CLIENTES E SISTEMA DE TICKETS

// --- FUNÇÕES DE CLIENTES ---

async function carregarClientes(popularDropdown = false) {
    const tabelaCorpo = document.getElementById('tabela-clientes-corpo');
    const dropdownClientes = document.getElementById('ticket-cliente-id');
    if (tabelaCorpo) tabelaCorpo.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';
    
    try {
        const resposta = await fetch('http://192.168.18.127:5000/clientes'); // Use seu IP
        const clientes = await resposta.json();
        
        // Lógica da Tabela de Clientes
        if (tabelaCorpo) {
            tabelaCorpo.innerHTML = '';
            clientes.forEach(cliente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cliente.id}</td><td>${cliente.nome_completo}</td><td>${cliente.cpf}</td>
                    <td>${cliente.login_pppoe}</td><td>${cliente.nome_plano || 'N/A'}</td><td>${cliente.status}</td>
                    <td>
                        <button class="btn-editar" data-id="${cliente.id}">Editar</button>
                        <button class="btn-excluir" data-id="${cliente.id}">Excluir</button>
                    </td>`;
                tabelaCorpo.appendChild(tr);
            });
        }
        
        // Lógica para popular o Dropdown de Clientes no formulário de ticket
        if (popularDropdown && dropdownClientes) {
            // Limpa opções antigas, exceto a primeira ("Selecione...")
            while (dropdownClientes.options.length > 1) {
                dropdownClientes.remove(1);
            }
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.id;
                option.textContent = `${cliente.id} - ${cliente.nome_completo}`;
                dropdownClientes.appendChild(option);
            });
        }

    } catch (error) {
        if (tabelaCorpo) tabelaCorpo.innerHTML = '<tr><td colspan="7" style="color: red;">Erro ao carregar a lista de clientes.</td></tr>';
    }
}

async function prepararEdicao(id) { /* ... (código existente) ... */
    try {
        const resposta = await fetch(`http://192.168.18.127:5000/clientes/${id}`);
        const cliente = await resposta.json();
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('nome').value = cliente.nome_completo;
        document.getElementById('cpf').value = cliente.cpf;
        document.getElementById('endereco').value = cliente.endereco;
        document.getElementById('login').value = cliente.login_pppoe;
        document.getElementById('senha').value = cliente.senha_pppoe;
        document.querySelector("#form-cliente button").textContent = 'Salvar Alterações';
        window.scrollTo(0, 0);
    } catch (error) { alert('Erro ao buscar dados do cliente para edição.'); }
}

function resetarFormulario() { /* ... (código existente) ... */
    document.getElementById('form-cliente').reset();
    document.getElementById('cliente-id').value = '';
    document.querySelector("#form-cliente button").textContent = 'Cadastrar Cliente';
}

// --- FUNÇÕES DE TICKETS ---

async function carregarTickets() {
    const tabelaCorpo = document.getElementById('tabela-tickets-corpo');
    tabelaCorpo.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    try {
        const resposta = await fetch('http://192.168.18.127:5000/tickets');
        const tickets = await resposta.json();
        tabelaCorpo.innerHTML = '';
        tickets.forEach(ticket => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ticket.id}</td>
                <td>${ticket.cliente_nome}</td>
                <td>${ticket.assunto}</td>
                <td>${new Date(ticket.data_abertura).toLocaleString('pt-BR')}</td>
                <td>${ticket.status}</td>
                <td>
                    ${ticket.status === 'aberto' ? `<button class="btn-fechar-ticket" data-id="${ticket.id}">Fechar</button>` : 'Fechado'}
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });
    } catch (error) {
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="color: red;">Erro ao carregar tickets.</td></tr>';
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Referências a Elementos ---
    const formCliente = document.getElementById('form-cliente');
    const divRespostaCliente = document.getElementById('mensagem-resposta-cliente');
    const btnAtualizarClientes = document.getElementById('btn-atualizar-clientes');
    const tabelaClientesCorpo = document.getElementById('tabela-clientes-corpo');
    
    const formTicket = document.getElementById('form-ticket');
    const divRespostaTicket = document.getElementById('mensagem-resposta-ticket');
    const btnAtualizarTickets = document.getElementById('btn-atualizar-tickets');
    const tabelaTicketsCorpo = document.getElementById('tabela-tickets-corpo');

    // --- LÓGICA DE CLIENTES ---
    formCliente.addEventListener('submit', async (event) => { /* ... (código existente, apenas ajusta a div de resposta) ... */
        event.preventDefault();
        const id = document.getElementById('cliente-id').value;
        const url = id ? `http://192.168.18.127:5000/clientes/${id}` : `http://192.168.18.127:5000/clientes`;
        const method = id ? 'PUT' : 'POST';
        const dadosCliente = { nome_completo: document.getElementById('nome').value, cpf: document.getElementById('cpf').value, endereco: document.getElementById('endereco').value, login_pppoe: document.getElementById('login').value, senha_pppoe: document.getElementById('senha').value, plano_id: 1 };
        try {
            const resposta = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosCliente) });
            const resultado = await resposta.json();
            if (resposta.ok) {
                divRespostaCliente.innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                resetarFormulario();
                carregarClientes(true); // Recarrega clientes e o dropdown
            } else { divRespostaCliente.innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`; }
        } catch (error) { divRespostaCliente.innerHTML = `<p style="color: red;">Não foi possível conectar à API.</p>`; }
    });

    tabelaClientesCorpo.addEventListener('click', async (event) => { /* ... (código existente) ... */
        if (event.target.classList.contains('btn-excluir')) {
            const id = event.target.dataset.id;
            if (confirm(`Tem certeza?`)) {
                try {
                    const resposta = await fetch(`http://192.168.18.127:5000/clientes/${id}`, { method: 'DELETE' });
                    if (resposta.ok) { carregarClientes(true); } else { alert('Erro ao excluir.'); }
                } catch (error) { alert('Falha de conexão.'); }
            }
        } else if (event.target.classList.contains('btn-editar')) {
            prepararEdicao(event.target.dataset.id);
        }
    });
    btnAtualizarClientes.addEventListener('click', () => carregarClientes(true));

    // --- LÓGICA DE TICKETS ---
    formTicket.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dadosTicket = {
            cliente_id: document.getElementById('ticket-cliente-id').value,
            assunto: document.getElementById('ticket-assunto').value,
            mensagem: document.getElementById('ticket-mensagem').value
        };
        try {
            const resposta = await fetch('http://192.168.18.127:5000/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosTicket) });
            const resultado = await resposta.json();
            if (resposta.ok) {
                divRespostaTicket.innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                formTicket.reset();
                carregarTickets();
            } else { divRespostaTicket.innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`; }
        } catch (error) { divRespostaTicket.innerHTML = `<p style="color: red;">Não foi possível conectar à API de tickets.</p>`; }
    });

    tabelaTicketsCorpo.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-fechar-ticket')) {
            const id = event.target.dataset.id;
            if (confirm(`Tem certeza que deseja fechar o ticket ${id}?`)) {
                try {
                    const resposta = await fetch(`http://192.168.18.127:5000/tickets/${id}/fechar`, { method: 'PUT' });
                    if (resposta.ok) { carregarTickets(); } else { alert('Erro ao fechar ticket.'); }
                } catch (error) { alert('Falha de conexão.'); }
            }
        }
    });
    btnAtualizarTickets.addEventListener('click', carregarTickets);

    // --- CARGA INICIAL ---
    carregarClientes(true); // Carrega clientes e popula o dropdown
    carregarTickets();     // Carrega os tickets
});
