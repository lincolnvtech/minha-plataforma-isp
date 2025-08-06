// Espera o conteúdo da página carregar completamente para rodar o script.
document.addEventListener('DOMContentLoaded', function () {
    
    // --- LÓGICA DE NAVEGAÇÃO ---
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    const defaultSection = 'dashboard';

    // Função para mostrar a seção correta e atualizar o link ativo
    function showSection(targetId) {
        pageSections.forEach(section => {
            section.style.display = 'none';
        });
        navLinks.forEach(l => l.classList.remove('active'));

        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Adiciona evento de clique aos links da sidebar
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            showSection(target);
            
            // Carrega os dados da seção clicada
            // (Ex: se clicar em 'Clientes', chama a função para carregar clientes)
            window.loadDataForSection(target);
        });
    });

    // --- CARREGAMENTO DE DADOS E EVENTOS POR SEÇÃO ---

    // Objeto para centralizar funções de carregamento
    window.loadDataForSection = (sectionId) => {
        switch(sectionId) {
            case 'dashboard':
                // Carregar dados dos KPIs (indicadores)
                // Ex: fetch('/api/kpis').then(...)
                document.getElementById('kpi-clientes').textContent = '1254';
                document.getElementById('kpi-tickets').textContent = '12';
                document.getElementById('kpi-olts').textContent = '4';
                document.getElementById('kpi-planos').textContent = '15';
                break;
            case 'provedor':
                loadOLTs();
                break;
            case 'clientes':
                loadClientes();
                loadPlanosParaSelect('cliente-plano-id');
                break;
            case 'planos':
                loadPlanos();
                break;
            case 'tickets':
                loadTickets();
                loadClientesParaSelect('ticket-cliente-id');
                break;
            case 'usuarios':
                loadUsuarios();
                break;
        }
    };

    // Função genérica para carregar dados em selects
    async function loadItensParaSelect(url, selectId, textKey, valueKey) {
        const select = document.getElementById(selectId);
        // Limpa opções antigas, exceto a primeira ("Selecione...")
        while (select.options.length > 1) {
            select.remove(1);
        }
        try {
            // const response = await fetch(url);
            // const data = await response.json();
            // --- DADOS DE EXEMPLO ---
            const data = (url.includes('planos')) 
                ? [{id: 1, nome: 'Fibra 300Mb'}, {id: 2, nome: 'Fibra 500Mb'}] 
                : [{id: 1, nome_completo: 'João da Silva'}, {id: 2, nome_completo: 'Maria Oliveira'}];
            // --- FIM DOS DADOS DE EXEMPLO ---
            data.forEach(item => {
                const option = new Option(item[textKey], item[valueKey]);
                select.add(option);
            });
        } catch (error) {
            console.error(`Erro ao carregar ${url}:`, error);
        }
    }

    function loadPlanosParaSelect(selectId) {
        loadItensParaSelect('/api/planos', selectId, 'nome', 'id');
    }
    
    function loadClientesParaSelect(selectId) {
        loadItensParaSelect('/api/clientes', selectId, 'nome_completo', 'id');
    }

    // --- SEÇÃO: PROVEDOR ---
    function loadOLTs() {
        console.log("Carregando OLTs...");
        // Exemplo: fetch('/api/olts').then(res => res.json()).then(data => { ... });
        const tabelaCorpo = document.getElementById('tabela-olts-corpo');
        tabelaCorpo.innerHTML = `
            <tr>
                <td>1</td>
                <td>OLT Principal</td>
                <td>192.168.0.1</td>
                <td>FiberHome</td>
                <td>admin</td>
                <td><button class="btn btn-sm btn-info">Editar</button> <button class="btn btn-sm btn-danger">Excluir</button></td>
            </tr>
        `;
    }

    // --- SEÇÃO: CLIENTES ---
    function loadClientes() {
        console.log("Carregando Clientes...");
        // Exemplo: fetch('/api/clientes').then(res => res.json()).then(data => { ... });
        const tabelaCorpo = document.getElementById('tabela-clientes-corpo');
        tabelaCorpo.innerHTML = `
            <tr>
                <td>1</td>
                <td>João da Silva</td>
                <td>123.456.789-00</td>
                <td>joao.silva</td>
                <td>Fibra 300Mb</td>
                <td><span class="badge bg-success">Ativo</span></td>
                <td><button class="btn btn-sm btn-info">Editar</button> <button class="btn btn-sm btn-warning">Provisionar</button></td>
            </tr>
        `;
    }
    document.getElementById('btn-atualizar-clientes').addEventListener('click', loadClientes);
    
    // Botão de ver senha
    const senhaInput = document.getElementById('senha');
    const btnVerSenha = document.getElementById('btn-ver-senha');
    btnVerSenha.addEventListener('click', () => {
        if (senhaInput.type === 'password') {
            senhaInput.type = 'text';
            btnVerSenha.innerHTML = '<i class="bi bi-eye-slash"></i>';
        } else {
            senhaInput.type = 'password';
            btnVerSenha.innerHTML = '<i class="bi bi-eye"></i>';
        }
    });

    // --- SEÇÃO: PLANOS ---
    function loadPlanos() {
        console.log("Carregando Planos...");
        const tabelaCorpo = document.getElementById('tabela-planos-corpo');
        tabelaCorpo.innerHTML = `
            <tr>
                <td>1</td>
                <td>Fibra 300Mb</td>
                <td>300</td>
                <td>150</td>
                <td>R$ 99,90</td>
                <td>plano_300</td>
                <td><button class="btn btn-sm btn-info">Editar</button> <button class="btn btn-sm btn-danger">Excluir</button></td>
            </tr>
        `;
    }
    document.getElementById('btn-atualizar-planos').addEventListener('click', loadPlanos);

    // --- SEÇÃO: TICKETS ---
    function loadTickets() {
        console.log("Carregando Tickets...");
        const tabelaCorpo = document.getElementById('tabela-tickets-corpo');
        tabelaCorpo.innerHTML = `
            <tr>
                <td>1024</td>
                <td>João da Silva</td>
                <td>Internet Lenta</td>
                <td>${new Date().toLocaleDateString('pt-BR')}</td>
                <td><span class="badge bg-warning text-dark">Aberto</span></td>
                <td><button class="btn btn-sm btn-primary">Ver</button></td>
            </tr>
        `;
    }
    document.getElementById('btn-atualizar-tickets').addEventListener('click', loadTickets);

    // --- SEÇÃO: USUÁRIOS ---
    function loadUsuarios() {
        console.log("Carregando Usuários...");
        const tabelaCorpo = document.getElementById('tabela-usuarios-corpo');
        tabelaCorpo.innerHTML = `
            <tr>
                <td>1</td>
                <td>Administrador</td>
                <td>admin@matrix.com</td>
                <td><button class="btn btn-sm btn-info">Editar</button> <button class="btn btn-sm btn-danger">Excluir</button></td>
            </tr>
        `;
    }

    // --- INICIALIZAÇÃO ---
    // Carrega a seção padrão e seus dados ao iniciar a aplicação
    showSection(defaultSection);
    window.loadDataForSection(defaultSection);

});
