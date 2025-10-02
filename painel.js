document.addEventListener('DOMContentLoaded', () => {
function renderModos() {
const ul = $('#listaModosVenda');
const sel = $('#prodModoVenda');
ul.innerHTML = ''; sel.innerHTML = '<option value="">Modo de Venda</option>';
state.modosVenda.forEach(m => {
const li = document.createElement('li'); li.textContent = `${m.nome} ${m.fracao || ''}`;
ul.appendChild(li);
const opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.nome; sel.appendChild(opt);
});
}
function addModo(nome, fracao) { state.modosVenda.push({ id: genId(), nome, fracao }); saveState(); renderAll(); }
// ================================================================
// PAINEL SEUNEGOCIO - Gestão Completa
// ================================================================

document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. ESTADO CENTRAL DO PAINEL (com persistência localStorage)
    // =================================================================
    let state = JSON.parse(localStorage.getItem("painelState")) || {
        produtos: [],
        categorias: [],
        modoVenda: [],
        clientes: [],
        cupons: [],
        publicidade: {},
        dadosLoja: {},
        cobertura: [],
        customizar: {},
    };

    let produtoEditandoId = null;

    function salvarLocal() {
        localStorage.setItem("painelState", JSON.stringify(state));
        atualizarPreview();
    }

    // =================================================================
    // 2. SELETORES DE ELEMENTOS DO HTML
    // =================================================================
    const menuContainer = document.getElementById('menu');
    const tabs = document.querySelectorAll('main .tab');

    // Produtos
    const prodNomeInput = document.getElementById('prodNome');
    const prodPrecoInput = document.getElementById('prodPreco');
    const prodImagemInput = document.getElementById('prodImagem');
    const prodDescricaoInput = document.getElementById('prodDescricao');
    const prodCategoriaSelect = document.getElementById('prodCategoria');
    const prodSubcategoriaSelect = document.getElementById('prodSubcategoria');
    const prodModoVendaSelect = document.getElementById('prodModoVenda');
    const prodEstoqueInput = document.getElementById('prodEstoque');
    const prodDestaqueInput = document.getElementById('prodDestaque');
    const prodAtivoInput = document.getElementById('prodAtivo');
    const btnAdicionarProduto = document.getElementById('btnAdicionarProduto');
    const listaProdutosContainer = document.getElementById('listaProdutosContainer');

    // Categorias
    const formNovaCategoria = document.querySelector('#categorias .form-group button');
    const listaCategorias = document.getElementById('category-tree');

    // Preview
    const previewIframe = document.getElementById('previewIframe');

    // =================================================================
    // 3. FUNÇÕES PRINCIPAIS
    // =================================================================

    // --- NAVEGAÇÃO ENTRE ABAS ---
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
            { id: 'preview', label: '🖥️ Preview' },
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

                if (targetTabId === "preview") atualizarPreview();
            }
        });
        if (menuButtons.length > 0) menuButtons[0].click();
    }

    // --- DASHBOARD ---
    function setupDashboardChart() {
        const ctx = document.getElementById('vendasChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Vendas da Semana (Exemplo)',
                    data: [120, 190, 300, 500, 200, 300, 450],
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // --- CATEGORIAS ---
    function renderizarCategorias() {
        listaCategorias.innerHTML = '';
        if (state.categorias.length === 0) {
            listaCategorias.innerHTML = '<p>Nenhuma categoria adicionada.</p>';
            return;
        }
        state.categorias.forEach(cat => {
            const details = document.createElement('details');
            details.innerHTML = `
                <summary>${cat.nome} 
                    <button class="btn-small btn-danger" data-id="${cat.id}">Excluir</button>
                </summary>
                <ul>
                    ${cat.subcategorias.map(sub => `
                        <li>${sub.nome} <button class="btn-small btn-danger" data-sub-id="${sub.id}" data-cat-id="${cat.id}">Excluir</button></li>
                    `).join('')}
                    <li><input type="text" placeholder="Nova Subcategoria"><button class="btn-small" data-cat-id="${cat.id}">Adicionar</button></li>
                </ul>
            `;
            listaCategorias.appendChild(details);
        });
        atualizarSelectsProdutos();
    }

    function adicionarCategoria() {
        const input = document.querySelector('#categorias input[type="text"]');
        const nome = input.value.trim();
        if (nome) {
            const novaCategoria = { id: Date.now(), nome, subcategorias: [] };
            state.categorias.push(novaCategoria);
            input.value = '';
            salvarLocal();
            renderizarCategorias();
        }
    }

    function gerenciarSubcategorias(e) {
        if (e.target.matches('.btn-small') && e.target.dataset.catId) {
            const catId = parseInt(e.target.dataset.catId);
            const categoria = state.categorias.find(c => c.id === catId);
            if (!categoria) return;
            const input = e.target.previousElementSibling;
            if (input && input.value) {
                categoria.subcategorias.push({ id: Date.now(), nome: input.value.trim() });
                input.value = '';
                salvarLocal();
                renderizarCategorias();
            }
        }
        if (e.target.matches('[data-sub-id]')) {
            const catId = parseInt(e.target.dataset.catId);
            const subId = parseInt(e.target.dataset.subId);
            const categoria = state.categorias.find(c => c.id === catId);
            if (categoria) {
                categoria.subcategorias = categoria.subcategorias.filter(sub => sub.id !== subId);
                salvarLocal();
                renderizarCategorias();
            }
        }
    }

    function removerCategoria(e) {
        if (e.target.matches('.btn-danger') && e.target.dataset.id) {
            const id = parseInt(e.target.dataset.id);
            state.categorias = state.categorias.filter(c => c.id !== id);
            salvarLocal();
            renderizarCategorias();
        }
    }

    function atualizarSelectsProdutos() {
        prodCategoriaSelect.innerHTML = '<option value="">Categoria</option>';
        prodSubcategoriaSelect.innerHTML = '<option value="">Subcategoria</option>';
        state.categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.nome;
            prodCategoriaSelect.appendChild(opt);
        });
        prodCategoriaSelect.addEventListener('change', () => {
            prodSubcategoriaSelect.innerHTML = '<option value="">Subcategoria</option>';
            const cat = state.categorias.find(c => c.id == prodCategoriaSelect.value);
            if (cat) {
                cat.subcategorias.forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub.id;
                    opt.textContent = sub.nome;
                    prodSubcategoriaSelect.appendChild(opt);
                });
            }
        });
    }

    // --- PRODUTOS ---
    function renderizarProdutos() {
        listaProdutosContainer.innerHTML = '';
        if (state.produtos.length === 0) {
            listaProdutosContainer.innerHTML = '<p>Nenhum produto adicionado ainda.</p>';
            return;
        }
        state.produtos.forEach(produto => {
            const produtoDiv = document.createElement('div');
            produtoDiv.className = 'product-item';
            produtoDiv.innerHTML = `
                <img src="${produto.imagem || 'https://via.placeholder.com/50'}" alt="Imagem">
                <div><strong>${produto.nome}</strong><br><span>R$ ${produto.preco.toFixed(2)}</span></div>
                <button class="btn-secondary btn-small" data-id="${produto.id}">Editar</button>
                <button class="btn-danger btn-small" data-id="${produto.id}">Remover</button>
            `;
            listaProdutosContainer.appendChild(produtoDiv);
        });
    }

    function adicionarOuAtualizarProduto() {
        const nome = prodNomeInput.value.trim();
        const preco = parseFloat(prodPrecoInput.value);
        if (!nome || isNaN(preco)) {
            alert('Nome e Preço são obrigatórios!');
            return;
        }
        if (produtoEditandoId) {
            const produtoExistente = state.produtos.find(p => p.id === produtoEditandoId);
            if (produtoExistente) {
                produtoExistente.nome = nome;
                produtoExistente.preco = preco;
                produtoExistente.imagem = prodImagemInput.value.trim();
                produtoExistente.descricao = prodDescricaoInput.value.trim();
                produtoExistente.categoria = prodCategoriaSelect.value;
                produtoExistente.subcategoria = prodSubcategoriaSelect.value;
                produtoExistente.modoVenda = prodModoVendaSelect.value;
                produtoExistente.estoque = prodEstoqueInput.value;
                produtoExistente.destaque = prodDestaqueInput.checked;
                produtoExistente.ativo = prodAtivoInput.checked;
            }
            produtoEditandoId = null;
            btnAdicionarProduto.textContent = 'Adicionar Produto';
        } else {
            const novoProduto = {
                id: Date.now(),
                nome,
                preco,
                imagem: prodImagemInput.value.trim(),
                descricao: prodDescricaoInput.value.trim(),
                categoria: prodCategoriaSelect.value,
                subcategoria: prodSubcategoriaSelect.value,
                modoVenda: prodModoVendaSelect.value,
                estoque: prodEstoqueInput.value,
                destaque: prodDestaqueInput.checked,
                ativo: prodAtivoInput.checked
            };
            state.produtos.push(novoProduto);
        }
        salvarLocal();
        limparCamposProduto();
        renderizarProdutos();
    }

    function editarProduto(id) {
        const produto = state.produtos.find(p => p.id === parseInt(id));
        if (produto) {
            prodNomeInput.value = produto.nome;
            prodPrecoInput.value = produto.preco;
            prodImagemInput.value = produto.imagem;
            prodDescricaoInput.value = produto.descricao;
            prodCategoriaSelect.value = produto.categoria;
            prodSubcategoriaSelect.value = produto.subcategoria;
            prodModoVendaSelect.value = produto.modoVenda;
            prodEstoqueInput.value = produto.estoque;
            prodDestaqueInput.checked = produto.destaque;
            prodAtivoInput.checked = produto.ativo;
            produtoEditandoId = produto.id;
            btnAdicionarProduto.textContent = 'Salvar Alterações';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function removerProduto(id) {
        if (confirm("Remover este produto?")) {
            state.produtos = state.produtos.filter(p => p.id !== parseInt(id));
            salvarLocal();
            renderizarProdutos();
        }
    }

    function limparCamposProduto() {
        prodNomeInput.value = '';
        prodPrecoInput.value = '';
        prodImagemInput.value = '';
        prodDescricaoInput.value = '';
        prodCategoriaSelect.value = '';
        prodSubcategoriaSelect.value = '';
        prodModoVendaSelect.value = '';
        prodEstoqueInput.value = '';
        prodDestaqueInput.checked = false;
        prodAtivoInput.checked = false;
    }

    // --- PREVIEW EM TEMPO REAL ---
    function atualizarPreview() {
        if (!previewIframe) return;
        let htmlTotem = `
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Preview Totem</title>
                <style>
                    body { font-family: sans-serif; padding:20px; background:#fafafa; }
                    .produto { border:1px solid #ccc; padding:10px; margin:10px; border-radius:8px; display:flex; gap:10px; background:#fff; }
                    .produto img { width:80px; height:80px; object-fit:cover; border-radius:6px; }
                    .produto h4 { margin:0; }
                    .categoria { margin-top:20px; }
                </style>
            </head>
            <body>
                <h2>Totem Preview</h2>
                ${state.categorias.map(cat => `
                    <div class="categoria">
                        <h3>${cat.nome}</h3>
                        ${state.produtos.filter(p => p.categoria == cat.id).map(p => `
                            <div class="produto">
                                <img src="${p.imagem || 'https://via.placeholder.com/80'}">
                                <div>
                                    <h4>${p.nome}</h4>
                                    <p>R$ ${p.preco.toFixed(2)}</p>
                                    <p>${p.descricao || ''}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </body>
            </html>
        `;
        previewIframe.srcdoc = htmlTotem;
    }

    // =================================================================
    // 4. EVENTOS
    // =================================================================
    btnAdicionarProduto.addEventListener('click', adicionarOuAtualizarProduto);
    listaProdutosContainer.addEventListener('click', (e) => {
        if (e.target.matches('.btn-danger')) removerProduto(e.target.dataset.id);
        if (e.target.matches('.btn-secondary')) editarProduto(e.target.dataset.id);
    });

    formNovaCategoria.addEventListener('click', adicionarCategoria);
    listaCategorias.addEventListener('click', (e) => {
        removerCategoria(e);
        gerenciarSubcategorias(e);
    });

    // =================================================================
    // 5. INICIALIZAÇÃO
    // =================================================================
    setupTabs();
    setupDashboardChart();
    renderizarCategorias();
    renderizarProdutos();
    atualizarPreview();

});
    // =================================================================
    // 6. MODO DE VENDA
    // =================================================================
    const modoVendaContainer = document.querySelector('#modo-venda .form-group');
    const modoVendaSelect = prodModoVendaSelect;

    function renderizarModoVenda() {
        modoVendaSelect.innerHTML = '<option value="">Modo de Venda</option>';
        state.modoVenda.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.nome;
            modoVendaSelect.appendChild(opt);
        });
    }

    modoVendaContainer.querySelector('button').addEventListener('click', () => {
        const select = modoVendaContainer.querySelector('select');
        const inputFracao = modoVendaContainer.querySelector('input[type="text"]');
        const nome = select.value + (inputFracao.value ? ` ${inputFracao.value}` : "");
        if (nome) {
            state.modoVenda.push({ id: Date.now(), nome });
            salvarLocal();
            renderizarModoVenda();
            inputFracao.value = '';
        }
    });

    // =================================================================
    // 7. CLIENTES
    // =================================================================
    const clientesTab = document.getElementById('clientes');
    const btnSalvarCliente = clientesTab.querySelector('button.btn-primary');
    const listaClientes = document.createElement('div');
    clientesTab.appendChild(listaClientes);

    function renderizarClientes() {
        listaClientes.innerHTML = '';
        if (state.clientes.length === 0) {
            listaClientes.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
            return;
        }
        state.clientes.forEach(c => {
            const div = document.createElement('div');
            div.className = "cliente-item";
            div.innerHTML = `
                <strong>${c.nome}</strong> - ${c.telefone}<br>
                <small>${c.endereco}, ${c.bairro}</small><br>
                <button class="btn-secondary btn-small" data-id="${c.id}">Editar</button>
                <button class="btn-danger btn-small" data-id="${c.id}">Excluir</button>
            `;
            listaClientes.appendChild(div);
        });
    }

    btnSalvarCliente.addEventListener('click', () => {
        const inputs = clientesTab.querySelectorAll('input, textarea');
        const nome = inputs[0].value.trim();
        const telefone = inputs[1].value.trim();
        if (!nome || !telefone) {
            alert("Nome e telefone obrigatórios!");
            return;
        }
        const cliente = {
            id: Date.now(),
            nome, telefone,
            endereco: inputs[2].value.trim(),
            bairro: inputs[3].value.trim(),
            obs: inputs[4].value.trim(),
            notificacoes: inputs[5].checked
        };
        state.clientes.push(cliente);
        salvarLocal();
        renderizarClientes();
        inputs.forEach(i => i.value = '');
        inputs[5].checked = false;
    });

    listaClientes.addEventListener('click', (e) => {
        if (e.target.matches('.btn-danger')) {
            state.clientes = state.clientes.filter(c => c.id != e.target.dataset.id);
            salvarLocal();
            renderizarClientes();
        }
    });

    // =================================================================
    // 8. CUPONS
    // =================================================================
    const cuponsTab = document.getElementById('cupons');
    const btnCriarCupom = cuponsTab.querySelector('button.btn-primary');
    const listaCupons = document.createElement('div');
    cuponsTab.appendChild(listaCupons);

    function renderizarCupons() {
        listaCupons.innerHTML = '';
        if (state.cupons.length === 0) {
            listaCupons.innerHTML = '<p>Nenhum cupom criado.</p>';
            return;
        }
        state.cupons.forEach(c => {
            const div = document.createElement('div');
            div.className = "cupom-item";
            div.innerHTML = `
                <strong>${c.codigo}</strong> - ${c.tipo} ${c.valor}<br>
                Validade: ${c.validade || '-'} | Limite: ${c.limite || '-'}<br>
                ${c.mensagem || ''}<br>
                <button class="btn-danger btn-small" data-id="${c.id}">Excluir</button>
            `;
            listaCupons.appendChild(div);
        });
    }

    btnCriarCupom.addEventListener('click', () => {
        const inputs = cuponsTab.querySelectorAll('input, select, textarea');
        const codigo = inputs[0].value.trim();
        const tipo = inputs[1].value.trim();
        const valor = inputs[2].value.trim();
        if (!codigo || !valor) {
            alert("Preencha código e valor");
            return;
        }
        const cupom = {
            id: Date.now(),
            codigo, tipo, valor,
            validade: inputs[3].value,
            minimo: inputs[4].value,
            limite: inputs[5].value,
            mensagem: inputs[6].value,
            ativo: inputs[7].checked
        };
        state.cupons.push(cupom);
        salvarLocal();
        renderizarCupons();
        inputs.forEach(i => {
            if (i.type === "checkbox") i.checked = false;
            else i.value = '';
        });
    });

    listaCupons.addEventListener('click', (e) => {
        if (e.target.matches('.btn-danger')) {
            state.cupons = state.cupons.filter(c => c.id != e.target.dataset.id);
            salvarLocal();
            renderizarCupons();
        }
    });

    // =================================================================
    // 9. COBERTURA
    // =================================================================
    const coberturaTab = document.getElementById('cobertura');
    const btnAdicionarBairro = coberturaTab.querySelector('button.btn-primary');
    const listaBairros = document.createElement('div');
    coberturaTab.appendChild(listaBairros);

    function renderizarCobertura() {
        listaBairros.innerHTML = '';
        if (state.cobertura.length === 0) {
            listaBairros.innerHTML = '<p>Nenhum bairro cadastrado.</p>';
            return;
        }
        state.cobertura.forEach(b => {
            const div = document.createElement('div');
            div.className = "bairro-item";
            div.innerHTML = `
                <strong>${b.nome}</strong> - Taxa: R$ ${b.taxa} - Tempo: ${b.tempo}min
                <button class="btn-danger btn-small" data-id="${b.id}">Excluir</button>
            `;
            listaBairros.appendChild(div);
        });
    }

    btnAdicionarBairro.addEventListener('click', () => {
        const inputs = coberturaTab.querySelectorAll('input');
        const nome = inputs[0].value.trim();
        const taxa = inputs[1].value.trim();
        const tempo = inputs[2].value.trim();
        if (!nome) return;
        state.cobertura.push({ id: Date.now(), nome, taxa, tempo });
        salvarLocal();
        renderizarCobertura();
        inputs.forEach(i => i.value = '');
    });

    listaBairros.addEventListener('click', (e) => {
        if (e.target.matches('.btn-danger')) {
            state.cobertura = state.cobertura.filter(b => b.id != e.target.dataset.id);
            salvarLocal();
            renderizarCobertura();
        }
    });

    // =================================================================
    // 10. PUBLICIDADE
    // =================================================================
    const publicidadeTab = document.getElementById('publicidade');
    const btnSalvarPublicidade = publicidadeTab.querySelector('button.btn-primary');

    btnSalvarPublicidade.addEventListener('click', () => {
        const inputs = publicidadeTab.querySelectorAll('input, textarea');
        state.publicidade = {
            bannerTexto: inputs[0].value,
            bannerImg: inputs[1].value,
            bannerLink: inputs[2].value,
            carrossel: inputs[3].value.split("\n").filter(l => l.trim()),
            instagram: inputs[4].value,
            facebook: inputs[5].value,
            whatsapp: inputs[6].value,
        };
        salvarLocal();
        alert("Publicidade salva!");
    });

    // =================================================================
    // 11. DADOS DA LOJA
    // =================================================================
    const dadosLojaTab = document.getElementById('dados-loja');
    const dadosInputs = dadosLojaTab.querySelectorAll('input, textarea');

    function salvarDadosLoja() {
        state.dadosLoja = {
            nome: dadosInputs[0].value,
            telefone: dadosInputs[1].value,
            pix: dadosInputs[2].value,
            banco: dadosInputs[3].value,
            endereco: dadosInputs[4].value,
            logo: dadosInputs[5].value,
            horarios: dadosInputs[6].value
        };
        salvarLocal();
        alert("Dados da loja salvos!");
    }

    dadosInputs.forEach(inp => inp.addEventListener('change', salvarDadosLoja));

    // =================================================================
    // 12. CUSTOMIZAR
    // =================================================================
    const customTab = document.getElementById('customizar');
    const customInputs = customTab.querySelectorAll('input');

    customInputs.forEach(inp => inp.addEventListener('change', () => {
        state.customizar = {
            corPrincipal: customInputs[0].value,
            fonte: customInputs[1].value,
            dark: customInputs[2].checked,
            musica: customInputs[3].value
        };
        salvarLocal();
    }));

    // =================================================================
    // 13. CONFIGURAÇÕES JSONBIN
    // =================================================================
    const btnPublicar = document.getElementById('btnPublicar');
    const btnImportar = document.querySelectorAll('.btn-secondary')[1];
    const btnRestaurarPadrao = document.getElementById('btnRestaurarPadrao');

    async function publicarDados() {
        if (!confirm("Publicar os dados no totem?")) return;
        const binId = document.getElementById('binId').value;
        const masterKey = document.getElementById('masterKey').value;
        if (!binId || !masterKey) { alert("Preencha BIN ID e Master Key"); return; }
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': masterKey },
                body: JSON.stringify(state)
            });
            if (!response.ok) throw new Error(`Erro: ${response.statusText}`);
            alert("✅ Publicado com sucesso!");
        } catch (err) {
            console.error(err);
            alert("❌ Erro ao publicar");
        }
    }

    async function importarDados() {
        if (!confirm("Importar os dados do totem?")) return;
        const binId = document.getElementById('binId').value;
        const masterKey = document.getElementById('masterKey').value;
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                headers: { 'X-Master-Key': masterKey }
            });
            if (!response.ok) throw new Error("Erro ao importar");
            const data = await response.json();
            state = data.record;
            salvarLocal();
            renderizarCategorias();
            renderizarProdutos();
            renderizarClientes();
            renderizarCupons();
            renderizarCobertura();
            renderizarModoVenda();
            alert("✅ Dados importados!");
        } catch (err) {
            console.error(err);
            alert("❌ Erro ao importar");
        }
    }

    function restaurarPadrao() {
        const senha = prompt("Digite a senha (1234) para restaurar:");
        if (senha === "1234") {
            if (confirm("Apagar todos os dados não publicados?")) {
                state = { produtos: [], categorias: [], modoVenda: [], clientes: [], cupons: [], publicidade: {}, dadosLoja: {}, cobertura: [], customizar: {} };
                salvarLocal();
                renderizarCategorias();
                renderizarProdutos();
                renderizarClientes();
                renderizarCupons();
                renderizarCobertura();
                renderizarModoVenda();
                alert("Restaurado!");
            }
        }
    }

    btnPublicar.addEventListener('click', publicarDados);
    btnImportar.addEventListener('click', importarDados);
    btnRestaurarPadrao.addEventListener('click', restaurarPadrao);

    // =================================================================
    // 14. INICIALIZAÇÃO FINAL
    // =================================================================
    renderizarClientes();
    renderizarCupons();
    renderizarCobertura();
    renderizarModoVenda();
});

