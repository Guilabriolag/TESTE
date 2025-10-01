document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. ESTADO CENTRAL DO PAINEL
    // =================================================================
    // Um objeto para guardar todos os dados do painel em memória.
    // Começamos com a lista de produtos.
    let state = {
        produtos: []
        // Futuramente: clientes: [], cupons: [], etc.
    };

    // =================================================================
    // 2. SELETORES DE ELEMENTOS DO HTML (DOM)
    // =================================================================
    const menuContainer = document.getElementById('menu');
    const tabs = document.querySelectorAll('main .tab');
    
    // Elementos da Aba de Produtos
    const formProduto = document.querySelector('#produtos .card');
    const btnCriarProduto = formProduto.querySelector('button'); // Pega o primeiro botão do formulário
    const listaProdutosContainer = document.createElement('div'); // Criamos um container para a lista
    formProduto.appendChild(listaProdutosContainer);

    // =================================================================
    // 3. FUNÇÕES PRINCIPAIS
    // =================================================================

    // --- FUNÇÕES DE NAVEGAÇÃO E UI GERAL ---
    function setupTabs() {
        const TABS_CONFIG = [
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'categorias', label: '🗂️ Categorias' },
            { id: 'modo-venda', label: '⚖️ Modo de Venda' },
            { id: 'produtos', label: '📦 Produtos' },
            { id: 'clientes', label: '👥 Clientes' },
            { id: 'cupons', label: '🎟️ Cupons' },
            { id: 'publicidade', label: '📢 Publicidade' },
            { id: 'dados-loja', label: '🗝️ Dados da Loja' },
            { id: 'cobertura', label: '🗺️ Cobertura' },
            { id: 'customizar', label: '🎨 Customizar' },
            { id: 'config', label: '⚙️ Configurações' }
        ];

        TABS_CONFIG.forEach(tabInfo => {
            const button = document.createElement('button');
            button.dataset.tab = tabInfo.id;
            button.innerHTML = tabInfo.label;
            menuContainer.appendChild(button);
        });

        const menuButtons = document.querySelectorAll('#menu button');
        menuContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const targetTabId = e.target.dataset.tab;
                tabs.forEach(tab => tab.classList.remove('active'));
                const targetTab = document.getElementById(targetTabId);
                if (targetTab) targetTab.classList.add('active');
                menuButtons.forEach(button => button.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        if (menuButtons.length > 0) menuButtons[0].click();
    }

    function setupDashboardChart() {
        const ctx = document.getElementById('vendasChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Vendas da Semana (Exemplo)',
                    data: [120, 190, 300, 500, 200, 300, 450],
                    backgroundColor: 'rgba(41, 128, 185, 0.2)',
                    borderColor: 'rgba(41, 128, 185, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // --- FUNÇÕES DA ABA PRODUTOS ---
    
    /**
     * Pega os dados do array 'state.produtos' e os desenha na tela.
     */
    function renderizarProdutos() {
        listaProdutosContainer.innerHTML = '<h3>Lista de Produtos Atuais</h3>';
        if (state.produtos.length === 0) {
            listaProdutosContainer.innerHTML += '<p>Nenhum produto adicionado ainda.</p>';
            return;
        }

        state.produtos.forEach((produto, index) => {
            const produtoDiv = document.createElement('div');
            produtoDiv.className = 'product-item'; // Usando uma classe para estilizar
            produtoDiv.innerHTML = `
                <img src="${produto.imagem || 'https://via.placeholder.com/50'}" alt="Imagem do Produto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                <div style="flex-grow: 1;">
                    <strong>${produto.nome}</strong><br>
                    <span>R$ ${produto.preco}</span>
                </div>
                <button class="btn-danger" data-index="${index}">Remover</button>
            `;
            listaProdutosContainer.appendChild(produtoDiv);
        });
    }

    /**
     * Lê os dados do formulário, adiciona ao estado e atualiza a tela.
     */
    function adicionarProduto() {
        const nomeInput = formProduto.querySelector('input[placeholder="Nome do Produto"]');
        const precoInput = formProduto.querySelector('input[placeholder="Preço (R$)"]');
        const imagemInput = formProduto.querySelector('input[placeholder="URL da Imagem"]');
        const descricaoTextarea = formProduto.querySelector('textarea');

        const nome = nomeInput.value.trim();
        const preco = precoInput.value;

        if (!nome || !preco) {
            alert('O nome e o preço do produto são obrigatórios!');
            return;
        }

        const novoProduto = {
            id: Date.now(), // ID único baseado no tempo
            nome: nome,
            preco: parseFloat(preco),
            imagem: imagemInput.value.trim(),
            descricao: descricaoTextarea.value.trim()
            // Adicionar outros campos aqui no futuro (categoria, estoque, etc.)
        };

        state.produtos.push(novoProduto);
        
        // Limpa o formulário
        nomeInput.value = '';
        precoInput.value = '';
        imagemInput.value = '';
        descricaoTextarea.value = '';

        renderizarProdutos();
    }
    
    /**
     * Remove um produto do estado e atualiza a tela.
     */
    function removerProduto(index) {
        if (confirm(`Tem certeza que deseja remover o produto "${state.produtos[index].nome}"?`)) {
            state.produtos.splice(index, 1);
            renderizarProdutos();
        }
    }

    // =================================================================
    // 4. EVENT LISTENERS (OUVINTES DE EVENTOS)
    // =================================================================
    
    // Evento para o botão "Criar Produto"
    btnCriarProduto.addEventListener('click', adicionarProduto);

    // Evento para os botões "Remover" (usando delegação de eventos)
    listaProdutosContainer.addEventListener('click', (e) => {
        // Verifica se o elemento clicado é um botão de remover
        if (e.target.classList.contains('btn-danger') && e.target.dataset.index) {
            removerProduto(e.target.dataset.index);
        }
    });

    // =================================================================
    // 5. INICIALIZAÇÃO DO SCRIPT
    // =================================================================
    setupTabs();
    setupDashboardChart();
    renderizarProdutos(); // Renderiza a lista inicial (vazia)
});
