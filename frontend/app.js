// app.js - VERSÃO COMPLETA E FINAL DO PAINEL

// GUARDA DE AUTENTICAÇÃO
if (!localStorage.getItem('usuario_logado')) {
    window.location.href = 'index.html';
}

const API_BASE_URL = 'http://38.159.184.69'; // Use seu IP

// --- FUNÇÃO PARA NAVEGAÇÃO ---
function showSection(targetId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.target === targetId);
    });
}

// --- FUNÇÕES DE PLANOS ---
async function carregarPlanos() {
    const tabelaCorpo = document.getElementById('tabela-planos-corpo');
    tabelaCorpo.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';
    try {
        const resposta = await fetch(`${API_BASE_URL}/planos`);
        const planos = await resposta.json();
        tabelaCorpo.innerHTML = '';
        planos.forEach(plano => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${plano.id}</td>
                <td>${plano.nome_plano}</td>
                <td>${plano.velocidade_download}</td>
                <td>${plano.velocidade_upload}</td>
                <td>R$ ${Number(plano.preco).toFixed(2)}</td>
                <td>${plano.mikrotik_profile_name}</td>
                <td>
                    <button class="btn btn-sm btn-warning btn-editar-plano" data-id="${plano.id}">Editar</button>
                    <button class="btn btn-sm btn-danger btn-excluir-plano" data-id="${plano.id}">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });
    } catch (error) {
        tabelaCorpo.innerHTML = '<tr><td colspan="7" style="color: red;">Erro ao carregar planos.</td></tr>';
    }
}
function prepararEdicaoPlano(plano) {
    document.getElementById('plano-id').value = plano.id;
    document.getElementById('plano-nome').value = plano.nome_plano;
    document.getElementById('plano-download').value = plano.velocidade_download;
    document.getElementById('plano-upload').value = plano.velocidade_upload;
    document.getElementById('plano-preco').value = plano.preco;
    document.getElementById('plano-profile').value = plano.mikrotik_profile_name;
    document.querySelector("#form-plano button[type='submit']").textContent = 'Atualizar Plano';
    document.getElementById('btn-cancelar-edicao-plano').classList.remove('d-none');
}
function resetarFormularioPlano() {
    document.getElementById('form-plano').reset();
    document.getElementById('plano-id').value = '';
    document.querySelector("#form-plano button[type='submit']").textContent = 'Salvar Plano';
    document.getElementById('btn-cancelar-edicao-plano').classList.add('d-none');
}

// --- FUNÇÕES DE CLIENTES ---
async function carregarClientes(popularDropdown = false) {
    const tabelaCorpo = document.getElementById('tabela-clientes-corpo');
    const dropdownClientes = document.getElementById('ticket-cliente-id');
    if (tabelaCorpo) tabelaCorpo.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';
    try {
        const resposta = await fetch(`${API_BASE_URL}/clientes`);
        const clientes = await resposta.json();
        if (tabelaCorpo) {
            tabelaCorpo.innerHTML = '';
            clientes.forEach(cliente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${cliente.id}</td><td>${cliente.nome_completo}</td><td>${cliente.cpf}</td><td>${cliente.login_pppoe}</td><td>${cliente.nome_plano || 'N/A'}</td><td>${cliente.status}</td><td><button class="btn btn-sm btn-warning btn-editar" data-id="${cliente.id}">Editar</button> <button class="btn btn-sm btn-danger btn-excluir" data-id="${cliente.id}">Excluir</button></td>`;
                tabelaCorpo.appendChild(tr);
            });
        }
        if (popularDropdown && dropdownClientes) {
            while (dropdownClientes.options.length > 1) { dropdownClientes.remove(1); }
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
async function prepararEdicao(id) {
    try {
        const resposta = await fetch(`${API_BASE_URL}/clientes/${id}`);
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
function resetarFormulario() {
    document.getElementById('form-cliente').reset();
    document.getElementById('cliente-id').value = '';
    document.querySelector("#form-cliente button").textContent = 'Cadastrar Cliente';
}

// --- FUNÇÕES DE TICKETS ---
async function carregarTickets() {
    const tabelaCorpo = document.getElementById('tabela-tickets-corpo');
    tabelaCorpo.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
    try {
        const resposta = await fetch(`${API_BASE_URL}/tickets`);
        const tickets = await resposta.json();
        tabelaCorpo.innerHTML = '';
        tickets.forEach(ticket => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${ticket.id}</td><td>${ticket.cliente_nome}</td><td>${ticket.assunto}</td><td>${new Date(ticket.data_abertura).toLocaleString('pt-BR')}</td><td>${ticket.status}</td><td>${ticket.status === 'aberto' ? `<button class="btn btn-sm btn-info btn-fechar-ticket" data-id="${ticket.id}">Fechar</button>` : 'Fechado'}</td>`;
            tabelaCorpo.appendChild(tr);
        });
    } catch (error) {
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="color: red;">Erro ao carregar tickets.</td></tr>';
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btn-logout');
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('usuario_logado');
        window.location.href = 'index.html';
    });

    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            showSection(event.target.dataset.target);
        });
    });
    showSection('planos');

    const formPlano = document.getElementById('form-plano');
    const tabelaPlanosCorpo = document.getElementById('tabela-planos-corpo');
    const formCliente = document.getElementById('form-cliente');
    const tabelaClientesCorpo = document.getElementById('tabela-clientes-corpo');
    const btnAtualizarClientes = document.getElementById('btn-atualizar-clientes');
    const formTicket = document.getElementById('form-ticket');
    const tabelaTicketsCorpo = document.getElementById('tabela-tickets-corpo');
    const btnAtualizarTickets = document.getElementById('btn-atualizar-tickets');

    formPlano.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('plano-id').value;
        const url = id ? `${API_BASE_URL}/planos/${id}` : `${API_BASE_URL}/planos`;
        const method = id ? 'PUT' : 'POST';
        const dadosPlano = { nome_plano: document.getElementById('plano-nome').value, velocidade_download: document.getElementById('plano-download').value, velocidade_upload: document.getElementById('plano-upload').value, preco: document.getElementById('plano-preco').value, mikrotik_profile_name: document.getElementById('plano-profile').value };
        try {
            const resposta = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosPlano) });
            const resultado = await resposta.json();
            if (resposta.ok) { alert(resultado.mensagem); resetarFormularioPlano(); carregarPlanos(); } else { alert(`Erro: ${resultado.erro}`); }
        } catch (error) { alert('Não foi possível conectar à API de planos.'); }
    });
    tabelaPlanosCorpo.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-editar-plano')) {
            const id = event.target.dataset.id;
            const resposta = await fetch(`${API_BASE_URL}/planos`);
            const planos = await resposta.json();
            const planoParaEditar = planos.find(p => p.id == id);
            if (planoParaEditar) prepararEdicaoPlano(planoParaEditar);
        } else if (event.target.classList.contains('btn-excluir-plano')) {
            const id = event.target.dataset.id;
            if (confirm(`Tem certeza?`)) {
                try {
                    const resposta = await fetch(`${API_BASE_URL}/planos/${id}`, { method: 'DELETE' });
                    const resultado = await resposta.json();
                    alert(resultado.mensagem || resultado.erro);
                    if (resposta.ok) carregarPlanos();
                } catch (error) { alert('Falha de conexão.'); }
            }
        }
    });
    document.getElementById('btn-cancelar-edicao-plano').addEventListener('click', resetarFormularioPlano);

    formCliente.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('cliente-id').value;
        const url = id ? `${API_BASE_URL}/clientes/${id}` : `${API_BASE_URL}/clientes`;
        const method = id ? 'PUT' : 'POST';
        const dadosCliente = { nome_completo: document.getElementById('nome').value, cpf: document.getElementById('cpf').value, endereco: document.getElementById('endereco').value, login_pppoe: document.getElementById('login').value, senha_pppoe: document.getElementById('senha').value, plano_id: 1 };
        try {
            const resposta = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosCliente) });
            const resultado = await resposta.json();
            if (resposta.ok) {
                document.getElementById('mensagem-resposta-cliente').innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                resetarFormulario();
                carregarClientes(true);
            } else { document.getElementById('mensagem-resposta-cliente').innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`; }
        } catch (error) { document.getElementById('mensagem-resposta-cliente').innerHTML = `<p style="color: red;">Não foi possível conectar à API.</p>`; }
    });
    tabelaClientesCorpo.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-excluir')) {
            const id = event.target.dataset.id;
            if (confirm(`Tem certeza?`)) {
                try {
                    const resposta = await fetch(`${API_BASE_URL}/clientes/${id}`, { method: 'DELETE' });
                    if (resposta.ok) { carregarClientes(true); } else { alert('Erro ao excluir.'); }
                } catch (error) { alert('Falha de conexão.'); }
            }
        } else if (event.target.classList.contains('btn-editar')) {
            prepararEdicao(event.target.dataset.id);
        }
    });
    btnAtualizarClientes.addEventListener('click', () => carregarClientes(true));

    formTicket.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dadosTicket = { cliente_id: document.getElementById('ticket-cliente-id').value, assunto: document.getElementById('ticket-assunto').value, mensagem: document.getElementById('ticket-mensagem').value };
        try {
            const resposta = await fetch(`${API_BASE_URL}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosTicket) });
            const resultado = await resposta.json();
            if (resposta.ok) {
                document.getElementById('mensagem-resposta-ticket').innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                formTicket.reset();
                carregarTickets();
            } else { document.getElementById('mensagem-resposta-ticket').innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`; }
        } catch (error) { document.getElementById('mensagem-resposta-ticket').innerHTML = `<p style="color: red;">Não foi possível conectar à API de tickets.</p>`; }
    });
    tabelaTicketsCorpo.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-fechar-ticket')) {
            const id = event.target.dataset.id;
            if (confirm(`Tem certeza?`)) {
                try {
                    const resposta = await fetch(`${API_BASE_URL}/tickets/${id}/fechar`, { method: 'PUT' });
                    if (resposta.ok) { carregarTickets(); } else { alert('Erro ao fechar ticket.'); }
                } catch (error) { alert('Falha de conexão.'); }
            }
        }
    });
    btnAtualizarTickets.addEventListener('click', carregarTickets);

    carregarPlanos();
    carregarClientes(true);
    carregarTickets();
});
