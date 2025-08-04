// app.js - VERSÃO 100% COMPLETA E FINAL DO PAINEL

// GUARDA DE AUTENTICAÇÃO
if (!localStorage.getItem('usuario_logado')) {
    window.location.href = '/';
}

const API_BASE_URL = '/api';

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

// --- FUNÇÕES DE USUÁRIOS ---
async function carregarUsuarios() {
    const tabelaCorpo = document.getElementById('tabela-usuarios-corpo');
    if (!tabelaCorpo) return;
    tabelaCorpo.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    try {
        const resposta = await fetch(`${API_BASE_URL}/usuarios`);
        const usuarios = await resposta.json();
        tabelaCorpo.innerHTML = '';
        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${usuario.id}</td><td>${usuario.nome}</td><td>${usuario.email}</td><td><button class="btn btn-sm btn-warning btn-editar-usuario" data-id="${usuario.id}">Editar</button> <button class="btn btn-sm btn-danger btn-excluir-usuario" data-id="${usuario.id}">Excluir</button></td>`;
            tabelaCorpo.appendChild(tr);
        });
    } catch (error) {
        tabelaCorpo.innerHTML = '<tr><td colspan="4" style="color: red;">Erro ao carregar usuários.</td></tr>';
    }
}
function prepararEdicaoUsuario(usuario) {
    document.getElementById('usuario-id').value = usuario.id;
    document.getElementById('usuario-nome').value = usuario.nome;
    document.getElementById('usuario-email').value = usuario.email;
    document.querySelector("#form-usuario button[type='submit']").textContent = 'Atualizar Usuário';
    document.getElementById('btn-cancelar-edicao-usuario').classList.remove('d-none');
    document.getElementById('usuario-senha').required = false;
}
function resetarFormularioUsuario() {
    document.getElementById('form-usuario').reset();
    document.getElementById('usuario-id').value = '';
    document.querySelector("#form-usuario button[type='submit']").textContent = 'Salvar Usuário';
    document.getElementById('btn-cancelar-edicao-usuario').classList.add('d-none');
    document.getElementById('usuario-senha').required = true;
}

// --- FUNÇÕES DE PLANOS ---
async function carregarPlanos() {
    const tabelaCorpo = document.getElementById('tabela-planos-corpo');
    if (!tabelaCorpo) return;
    tabelaCorpo.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';
    try {
        const resposta = await fetch(`${API_BASE_URL}/planos`);
        const planos = await resposta.json();
        tabelaCorpo.innerHTML = '';
        planos.forEach(plano => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${plano.id}</td><td>${plano.nome_plano}</td><td>${plano.velocidade_download}</td><td>${plano.velocidade_upload}</td><td>R$ ${Number(plano.preco).toFixed(2)}</td><td>${plano.mikrotik_profile_name}</td><td><button class="btn btn-sm btn-warning btn-editar-plano" data-id="${plano.id}">Editar</button> <button class="btn btn-sm btn-danger btn-excluir-plano" data-id="${plano.id}">Excluir</button></td>`;
            tabelaCorpo.appendChild(tr);
        });
    } catch (error) {
        tabelaCorpo.innerHTML = '<tr><td colspan="7" style="color: red;">Erro ao carregar planos.</td></tr>';
    }
}
async function popularDropdownPlanos() {
    const dropdownPlanos = document.getElementById('cliente-plano-id');
    if(!dropdownPlanos) return;
    try {
        const resposta = await fetch(`${API_BASE_URL}/planos`);
        const planos = await resposta.json();
        while (dropdownPlanos.options.length > 1) { dropdownPlanos.remove(1); }
        planos.forEach(plano => {
            const option = document.createElement('option');
            option.value = plano.id;
            option.textContent = plano.nome_plano;
            dropdownPlanos.appendChild(option);
        });
    } catch (error) { console.error("Erro ao popular dropdown de planos:", error); }
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
                tr.innerHTML = `<td>${cliente.id}</td><td>${cliente.nome_completo}</td><td>${cliente.cnpj_cpf}</td><td>${cliente.login_pppoe}</td><td>${cliente.nome_plano || 'N/A'}</td><td>${cliente.status}</td><td><button class="btn btn-sm btn-warning btn-editar" data-id="${cliente.id}">Editar</button> <button class="btn btn-sm btn-danger btn-excluir" data-id="${cliente.id}">Excluir</button></td>`;
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
        if (!resposta.ok) throw new Error('Cliente nao encontrado na API');
        const cliente = await resposta.json();
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('nome').value = cliente.nome_completo;
        document.getElementById('cnpj_cpf').value = cliente.cnpj_cpf;
        document.getElementById('rg').value = cliente.rg;
        document.getElementById('endereco').value = cliente.endereco;
        document.getElementById('bairro').value = cliente.bairro;
        document.getElementById('numero').value = cliente.numero;
        document.getElementById('complemento').value = cliente.complemento;
        document.getElementById('login').value = cliente.login_pppoe;
        document.getElementById('senha').value = cliente.senha_pppoe;
        document.getElementById('cliente-plano-id').value = cliente.plano_id;
        document.querySelector("#form-cliente button").textContent = 'Salvar Alterações';
        window.scrollTo(0, 0);
    } catch (error) { 
        console.error("Erro em prepararEdicao:", error);
        alert('Erro ao buscar dados do cliente para edição.'); 
    }
}
function resetarFormulario() {
    document.getElementById('form-cliente').reset();
    document.getElementById('cliente-id').value = '';
    document.querySelector("#form-cliente button").textContent = 'Cadastrar Cliente';
}

// --- FUNÇÕES DE TICKETS ---
async function carregarTickets() {
    const tabelaCorpo = document.getElementById('tabela-tickets-corpo');
    if(!tabelaCorpo) return;
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

// --- EVENT LISTENER PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    // Referências
    const btnLogout = document.getElementById('btn-logout');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    // Logout
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('usuario_logado');
        window.location.href = '/';
    });

    // Navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            showSection(event.target.dataset.target);
        });
    });
    
    // --- LÓGICA DE CADA SEÇÃO ---
    const formUsuario = document.getElementById('form-usuario');
    if (formUsuario) {
        const tabelaUsuariosCorpo = document.getElementById('tabela-usuarios-corpo');
        const btnNovoUsuario = document.getElementById('btn-novo-usuario');
        formUsuario.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = document.getElementById('usuario-id').value;
            const url = id ? `${API_BASE_URL}/usuarios/${id}` : `${API_BASE_URL}/usuarios`;
            const method = id ? 'PUT' : 'POST';
            const dadosUsuario = { nome: document.getElementById('usuario-nome').value, email: document.getElementById('usuario-email').value };
            const senha = document.getElementById('usuario-senha').value;
            if (senha) { dadosUsuario.senha = senha; } else if (!id) { alert('A senha é obrigatória para criar um novo usuário.'); return; }
            try {
                const resposta = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosUsuario) });
                const resultado = await resposta.json();
                alert(resultado.mensagem || resultado.erro);
                if (resposta.ok) { resetarFormularioUsuario(); carregarUsuarios(); }
            } catch (error) { alert('Não foi possível conectar à API de usuários.'); }
        });
        tabelaUsuariosCorpo.addEventListener('click', async (event) => {
            if (event.target.classList.contains('btn-editar-usuario')) {
                const id = event.target.dataset.id;
                const resposta = await fetch(`${API_BASE_URL}/usuarios`);
                const usuarios = await resposta.json();
                const usuarioParaEditar = usuarios.find(u => u.id == id);
                if(usuarioParaEditar) prepararEdicaoUsuario(usuarioParaEditar);
            } else if (event.target.classList.contains('btn-excluir-usuario')) {
                const id = event.target.dataset.id;
                if (confirm(`Tem certeza?`)) {
                    try {
                        const resposta = await fetch(`${API_BASE_URL}/usuarios/${id}`, { method: 'DELETE' });
                        const resultado = await resposta.json();
                        alert(resultado.mensagem || resultado.erro);
                        if(resposta.ok) carregarUsuarios();
                    } catch (error) { alert('Falha de conexão.'); }
                }
            }
        });
        document.getElementById('btn-cancelar-edicao-usuario').addEventListener('click', resetarFormularioUsuario);
        btnNovoUsuario.addEventListener('click', () => { resetarFormularioUsuario(); window.scrollTo(0, 0); });
    }

    const formPlano = document.getElementById('form-plano');
    if (formPlano) {
        const tabelaPlanosCorpo = document.getElementById('tabela-planos-corpo');
        const btnAtualizarPlanos = document.getElementById('btn-atualizar-planos');
        formPlano.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = document.getElementById('plano-id').value;
            const url = id ? `${API_BASE_URL}/planos/${id}` : `${API_BASE_URL}/planos`;
            const method = id ? 'PUT' : 'POST';
            const dadosPlano = { nome_plano: document.getElementById('plano-nome').value, velocidade_download: document.getElementById('plano-download').value, velocidade_upload: document.getElementById('plano-upload').value, preco: document.getElementById('plano-preco').value, mikrotik_profile_name: document.getElementById('plano-profile').value };
            try {
                const resposta = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosPlano) });
                const resultado = await resposta.json();
                if (resposta.ok) { alert(resultado.mensagem); resetarFormularioPlano(); carregarPlanos(); popularDropdownPlanos(); } else { alert(`Erro: ${resultado.erro}`); }
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
                        if (resposta.ok) { carregarPlanos(); popularDropdownPlanos(); }
                    } catch (error) { alert('Falha de conexão.'); }
                }
            }
        });
        document.getElementById('btn-cancelar-edicao-plano').addEventListener('click', resetarFormularioPlano);
        btnAtualizarPlanos.addEventListener('click', carregarPlanos);
    }

    const formCliente = document.getElementById('form-cliente');
    if (formCliente) {
        const tabelaClientesCorpo = document.getElementById('tabela-clientes-corpo');
        const btnAtualizarClientes = document.getElementById('btn-atualizar-clientes');
        formCliente.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = document.getElementById('cliente-id').value;
            const url = id ? `${API_BASE_URL}/clientes/${id}` : `${API_BASE_URL}/clientes`;
            const method = id ? 'PUT' : 'POST';
            const dadosCliente = { 
                nome_completo: document.getElementById('nome').value, 
                cnpj_cpf: document.getElementById('cnpj_cpf').value,
                rg: document.getElementById('rg').value,
                endereco: document.getElementById('endereco').value,
                bairro: document.getElementById('bairro').value,
                numero: document.getElementById('numero').value,
                complemento: document.getElementById('complemento').value,
                login_pppoe: document.getElementById('login').value, 
                senha_pppoe: document.getElementById('senha').value, 
                plano_id: document.getElementById('cliente-plano-id').value 
            };
            try {
                const resposta = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosCliente) });
                const resultado = await resposta.json();
                const divRespostaCliente = document.getElementById('mensagem-resposta-cliente');
                if (resposta.ok) {
                    divRespostaCliente.innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                    resetarFormulario();
                    carregarClientes(true);
                } else { divRespostaCliente.innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`; }
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
        const btnVerSenha = document.getElementById('btn-ver-senha');
        if (btnVerSenha) {
            const campoSenha = document.getElementById('senha');
            btnVerSenha.addEventListener('click', () => {
                if (campoSenha.type === 'password') {
                    campoSenha.type = 'text';
                    btnVerSenha.textContent = '🙈';
                } else {
                    campoSenha.type = 'password';
                    btnVerSenha.textContent = '👁️';
                }
            });
        }
    }

    const formTicket = document.getElementById('form-ticket');
    if (formTicket) {
        const tabelaTicketsCorpo = document.getElementById('tabela-tickets-corpo');
        const btnAtualizarTickets = document.getElementById('btn-atualizar-tickets');
        formTicket.addEventListener('submit', async (event) => {
            event.preventDefault();
            const dadosTicket = { cliente_id: document.getElementById('ticket-cliente-id').value, assunto: document.getElementById('ticket-assunto').value, mensagem: document.getElementById('ticket-mensagem').value };
            try {
                const resposta = await fetch(`${API_BASE_URL}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosTicket) });
                const resultado = await resposta.json();
                const divRespostaTicket = document.getElementById('mensagem-resposta-ticket');
                if (resposta.ok) {
                    divRespostaTicket.innerHTML = `<p style="color: green;">${resultado.mensagem}</p>`;
                    formTicket.reset();
                    carregarTickets();
                } else { divRespostaTicket.innerHTML = `<p style="color: red;">Erro: ${resultado.erro}</p>`; }
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
    }
    
    // CARGA INICIAL DE DADOS
    carregarPlanos();
    carregarClientes(true);
    carregarTickets();
    carregarUsuarios();
    popularDropdownPlanos();
    
    showSection('planos'); // Define a seção inicial
});
