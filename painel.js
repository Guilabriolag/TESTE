// ================================================================
// PAINEL SEUNEGOCIO - Versão corrigida (menu ocultável + sem duplicatas)
// Substitua TODO o seu painel.js por este arquivo.
// ================================================================

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------
  // 1) Estado central + persistência
  // ------------------------
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
  let clienteEditandoId = null;
  let cupomEditandoId = null;

  function salvarLocal() {
    localStorage.setItem("painelState", JSON.stringify(state));
    atualizarPreview();
  }

  // ------------------------
  // 2) Seletores (uma única vez, sem duplicatas)
  // ------------------------
  const sidebar = document.getElementById('sidebar');
  const menuContainer = document.getElementById('menu');
  const tabs = document.querySelectorAll('main .tab');

  // Dashboard
  const vendasChartEl = document.getElementById('vendasChart');

  // Categorias
  const formNovaCategoriaBtn = document.querySelector('#categorias .form-group button');
  const listaCategorias = document.getElementById('category-tree');

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

  // Clientes
  const clientesTab = document.getElementById('clientes');

  // Cupons
  const cuponsTab = document.getElementById('cupons');

  // Cobertura
  const coberturaTab = document.getElementById('cobertura');

  // Publicidade
  const publicidadeTab = document.getElementById('publicidade');

  // Dados da Loja
  const dadosLojaTab = document.getElementById('dados-loja');

  // Customizar
  const customTab = document.getElementById('customizar');

  // Preview iframe
  const previewIframe = document.getElementById('previewIframe');

  // Configurações (JSONBin)
  const binIdInput = document.getElementById('binId');
  const masterKeyInput = document.getElementById('masterKey');
  const btnPublicar = document.getElementById('btnPublicar');
  const secondaryButtons = document.querySelectorAll('.btn-secondary');
  const btnImportar = secondaryButtons && secondaryButtons[1] ? secondaryButtons[1] : null;
  const btnExportar = secondaryButtons && secondaryButtons[0] ? secondaryButtons[0] : null;
  const btnRestaurarPadrao = document.getElementById('btnRestaurarPadrao');

  // ------------------------
  // 3) Funções utilitárias / UI
  // ------------------------
  function criarElemento(tag, props = {}, children = '') {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => el.setAttribute(k, v));
    el.innerHTML = children;
    return el;
  }

  // ------------------------
  // 4) Setup do menu (agora com toggle do sidebar)
  // ------------------------
  function setupTabs() {
    // Config com ícone (emoji) + label (separa emoji do texto)
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
      { id: 'preview', label: '🖥️ Preview em Tempo' },
      { id: 'customizar', label: '🎨 Customizar' },
      { id: 'config', label: '⚙️ Configurações' }
    ];

    // Botão toggle do sidebar (☰)
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'sidebarToggle';
    toggleBtn.type = 'button';
    toggleBtn.title = 'Ocultar/Mostrar menu';
    toggleBtn.innerHTML = '☰';
    // Insere no topo do sidebar (antes do menu)
    if (sidebar) {
      sidebar.insertBefore(toggleBtn, menuContainer);
    } else {
      // se não achar sidebar, coloca antes do menuContainer
      menuContainer.parentElement.insertBefore(toggleBtn, menuContainer);
    }

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      // opcional: armazenar preferência
      const collapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
    });

    // Cria botões do menu com estrutura icon + label
    menuContainer.innerHTML = ''; // limpa
    TABS_CONFIG.forEach(tabInfo => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.tab = tabInfo.id;
      // separa emoji do texto (split no primeiro espaço)
      const parts = tabInfo.label.split(' ');
      const icon = parts.shift();
      const label = parts.join(' ');
      button.innerHTML = `<span class="menu-icon">${icon}</span><span class="menu-label">${label}</span>`;
      button.title = tabInfo.label;
      menuContainer.appendChild(button);
    });

    // Recupera preferência de colapso
    if (localStorage.getItem('sidebarCollapsed') === '1') {
      sidebar.classList.add('collapsed');
    }

    // Ação de clique nas entradas do menu
    menuContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const targetTabId = btn.dataset.tab;
      tabs.forEach(tab => tab.classList.remove('active'));
      const targetTab = document.getElementById(targetTabId);
      if (targetTab) targetTab.classList.add('active');
      // active button visual
      menuContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (targetTabId === 'preview') {
        atualizarPreview();
      }
    });

    // ativa a primeira aba por padrão (se houver)
    const first = menuContainer.querySelector('button');
    if (first) first.click();
  }

  // ------------------------
  // 5) Dashboard (Chart)
  // ------------------------
  function setupDashboardChart() {
    if (!vendasChartEl) return;
    try {
      new Chart(vendasChartEl.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
          datasets: [{
            label: 'Vendas da Semana (Exemplo)',
            data: [120, 190, 300, 500, 200, 300, 450],
            backgroundColor: 'rgba(52, 152, 219, 0.15)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 2,
            tension: 0.3
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      });
    } catch (err) {
      console.warn('Erro ao criar chart:', err);
    }
  }

  // ------------------------
  // 6) CATEGORIAS (CRUD) e integração nos selects de produto
  // ------------------------
  function renderizarCategorias() {
    listaCategorias.innerHTML = '';
    if (!state.categorias || state.categorias.length === 0) {
      listaCategorias.innerHTML = '<p>Nenhuma categoria adicionada.</p>';
      atualizarSelectsProdutos();
      return;
    }
    state.categorias.forEach(cat => {
      const details = document.createElement('details');
      details.innerHTML = `
        <summary>${cat.nome} <button class="btn-small btn-danger" data-id="${cat.id}">Excluir</button></summary>
        <ul>
          ${cat.subcategorias.map(sub => `<li>${sub.nome} <button class="btn-small btn-danger" data-sub-id="${sub.id}" data-cat-id="${cat.id}">Excluir</button></li>`).join('')}
          <li><input type="text" placeholder="Nova Subcategoria"><button class="btn-small" data-cat-id="${cat.id}">Adicionar</button></li>
        </ul>
      `;
      listaCategorias.appendChild(details);
    });
    atualizarSelectsProdutos();
  }

  function adicionarCategoria() {
    const input = document.querySelector('#categorias input[type="text"]');
    if (!input) return;
    const nome = input.value.trim();
    if (!nome) return;
    state.categorias.push({ id: Date.now(), nome, subcategorias: [] });
    input.value = '';
    salvarLocal();
    renderizarCategorias();
  }

  function gerenciarSubcategorias(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    // adicionar sub
    if (btn.dataset.catId && !btn.dataset.subId) {
      const catId = parseInt(btn.dataset.catId);
      const categoria = state.categorias.find(c => c.id === catId);
      const input = btn.previousElementSibling;
      if (categoria && input && input.value.trim()) {
        categoria.subcategorias.push({ id: Date.now(), nome: input.value.trim() });
        input.value = '';
        salvarLocal();
        renderizarCategorias();
      }
      return;
    }
    // excluir sub
    if (btn.dataset.subId) {
      const subId = parseInt(btn.dataset.subId);
      const catId = parseInt(btn.dataset.catId);
      const categoria = state.categorias.find(c => c.id === catId);
      if (categoria) {
        categoria.subcategorias = categoria.subcategorias.filter(s => s.id !== subId);
        salvarLocal();
        renderizarCategorias();
      }
      return;
    }
  }

  function removerCategoria(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.id) {
      const id = parseInt(btn.dataset.id);
      state.categorias = state.categorias.filter(c => c.id !== id);
      // atualizar produtos que usavam essa categoria (limpar campo)
      state.produtos = state.produtos.map(p => p.categoria == id ? {...p, categoria: '', subcategoria: ''} : p);
      salvarLocal();
      renderizarCategorias();
      renderizarProdutos();
    }
  }

  function atualizarSelectsProdutos() {
    if (!prodCategoriaSelect || !prodSubcategoriaSelect) return;
    prodCategoriaSelect.innerHTML = '<option value="">Categoria</option>';
    prodSubcategoriaSelect.innerHTML = '<option value="">Subcategoria</option>';
    state.categorias.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.nome;
      prodCategoriaSelect.appendChild(opt);
    });
    // atualiza sub quando muda categoria
    prodCategoriaSelect.addEventListener('change', () => {
      prodSubcategoriaSelect.innerHTML = '<option value="">Subcategoria</option>';
      const cat = state.categorias.find(c => c.id == prodCategoriaSelect.value);
      if (cat) {
        cat.subcategorias.forEach(sub => {
          const o = document.createElement('option');
          o.value = sub.id;
          o.textContent = sub.nome;
          prodSubcategoriaSelect.appendChild(o);
        });
      }
    });
  }

  // ------------------------
  // 7) PRODUTOS (CRUD)
  // ------------------------
  function renderizarProdutos() {
    listaProdutosContainer.innerHTML = '';
    if (!state.produtos || state.produtos.length === 0) {
      listaProdutosContainer.innerHTML = '<p>Nenhum produto adicionado ainda.</p>';
      return;
    }
    state.produtos.forEach(produto => {
      const produtoDiv = document.createElement('div');
      produtoDiv.className = 'product-item';
      produtoDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${produto.imagem || 'https://via.placeholder.com/50'}" alt="Imagem">
          <div><strong>${produto.nome}</strong><br><span>R$ ${Number(produto.preco).toFixed(2)}</span></div>
        </div>
        <div>
          <button class="btn-secondary btn-small" data-id="${produto.id}" data-action="edit">Editar</button>
          <button class="btn-danger btn-small" data-id="${produto.id}" data-action="remove">Remover</button>
        </div>
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
      const produto = state.produtos.find(p => p.id === produtoEditandoId);
      if (produto) {
        produto.nome = nome;
        produto.preco = preco;
        produto.imagem = prodImagemInput.value.trim();
        produto.descricao = prodDescricaoInput.value.trim();
        produto.categoria = prodCategoriaSelect.value;
        produto.subcategoria = prodSubcategoriaSelect.value;
        produto.modoVenda = prodModoVendaSelect.value;
        produto.estoque = prodEstoqueInput.value;
        produto.destaque = prodDestaqueInput.checked;
        produto.ativo = prodAtivoInput.checked;
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
    if (!produto) return;
    prodNomeInput.value = produto.nome;
    prodPrecoInput.value = produto.preco;
    prodImagemInput.value = produto.imagem;
    prodDescricaoInput.value = produto.descricao;
    prodCategoriaSelect.value = produto.categoria;
    // dispara change para popular subcategoria
    prodCategoriaSelect.dispatchEvent(new Event('change'));
    prodSubcategoriaSelect.value = produto.subcategoria;
    prodModoVendaSelect.value = produto.modoVenda;
    prodEstoqueInput.value = produto.estoque;
    prodDestaqueInput.checked = !!produto.destaque;
    prodAtivoInput.checked = !!produto.ativo;
    produtoEditandoId = produto.id;
    btnAdicionarProduto.textContent = 'Salvar Alterações';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function removerProdutoPorId(id) {
    if (!confirm('Remover este produto?')) return;
    state.produtos = state.produtos.filter(p => p.id !== parseInt(id));
    salvarLocal();
    renderizarProdutos();
  }

  function limparCamposProduto() {
    if (!prodNomeInput) return;
    prodNomeInput.value = '';
    prodPrecoInput.value = '';
    prodImagemInput.value = '';
    prodDescricaoInput.value = '';
    if (prodCategoriaSelect) prodCategoriaSelect.value = '';
    if (prodSubcategoriaSelect) prodSubcategoriaSelect.value = '';
    if (prodModoVendaSelect) prodModoVendaSelect.value = '';
    if (prodEstoqueInput) prodEstoqueInput.value = '';
    if (prodDestaqueInput) prodDestaqueInput.checked = false;
    if (prodAtivoInput) prodAtivoInput.checked = false;
  }

  // ------------------------
  // 8) PREVIEW (iframe) - gera HTML dinamicamente via srcdoc
  // ------------------------
  function atualizarPreview() {
    if (!previewIframe) return;
    // Gera um HTML simples baseado em state (expanda conforme necessidade)
    const cssInline = `
      body{font-family:Arial,Helvetica,sans-serif;padding:18px;background:#f9f9fb;color:#222}
      .cat{margin-bottom:18px}
      .cat h3{margin:0 0 8px 0}
      .prod{display:flex;gap:12px;align-items:center;background:#fff;border-radius:8px;padding:10px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
      .prod img{width:80px;height:80px;object-fit:cover;border-radius:6px}
      .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
      .banner{width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:12px}
    `;
    let html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview Totem</title><style>${cssInline}</style></head><body>`;
    // dados loja e banner
    if (state.publicidade && state.publicidade.bannerImg) {
      html += `<img class="banner" src="${state.publicidade.bannerImg}" alt="Banner">`;
    } else if (state.dadosLoja && state.dadosLoja.logo) {
      html += `<div class="header"><div><strong>${state.dadosLoja.nome || ''}</strong></div><div><img src="${state.dadosLoja.logo}" style="height:48px"></div></div>`;
    } else {
      html += `<div class="header"><div><strong>${state.dadosLoja.nome || 'Minha Loja'}</strong></div></div>`;
    }

    // categorias e produtos
    state.categorias.forEach(cat => {
      html += `<div class="cat"><h3>${cat.nome}</h3>`;
      const produtosDaCat = state.produtos.filter(p => String(p.categoria) === String(cat.id));
      if (produtosDaCat.length === 0) {
        html += `<p><em>Sem produtos nesta categoria</em></p>`;
      } else {
        produtosDaCat.forEach(p => {
          html += `<div class="prod"><img src="${p.imagem || 'https://via.placeholder.com/80'}" alt=""><div><strong>${p.nome}</strong><div>R$ ${Number(p.preco).toFixed(2)}</div><div style="opacity:.8">${p.descricao || ''}</div></div></div>`;
        });
      }
      html += `</div>`;
    });

    html += `</body></html>`;
    previewIframe.srcdoc = html;
  }

  // ------------------------
  // 9) Modo de Venda (simples)
  // ------------------------
  function renderizarModoVenda() {
    if (!prodModoVendaSelect) return;
    prodModoVendaSelect.innerHTML = '<option value="">Modo de Venda</option>';
    state.modoVenda.forEach(m => {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.nome;
      prodModoVendaSelect.appendChild(o);
    });
  }

  // Modo de venda: botão do HTML já está dentro de #modo-venda .form-group button
  (function initModoVendaBtn() {
    const mvGroup = document.querySelector('#modo-venda .form-group');
    if (!mvGroup) return;
    const btn = mvGroup.querySelector('button');
    btn.addEventListener('click', () => {
      const select = mvGroup.querySelector('select');
      const inputFracao = mvGroup.querySelector('input[type="text"]');
      const nome = (select.value || '').trim() + (inputFracao.value ? ` ${inputFracao.value}` : '');
      if (nome.trim()) {
        state.modoVenda.push({ id: Date.now(), nome: nome.trim() });
        inputFracao.value = '';
        salvarLocal();
        renderizarModoVenda();
      }
    });
  })();

  // ------------------------
  // 10) CLIENTES (CRUD simples)
  // ------------------------
  // cria área de listagem se não existir
  const listaClientes = document.createElement('div');
  clientesTab.appendChild(listaClientes);

  function renderizarClientes() {
    listaClientes.innerHTML = '';
    if (!state.clientes || state.clientes.length === 0) {
      listaClientes.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
      return;
    }
    state.clientes.forEach(c => {
      const d = document.createElement('div');
      d.className = 'cliente-item';
      d.innerHTML = `<div><strong>${c.nome}</strong> - ${c.telefone}<br><small>${c.endereco || ''} ${c.bairro || ''}</small></div><div><button class="btn-secondary btn-small" data-id="${c.id}" data-action="edit">Editar</button> <button class="btn-danger btn-small" data-id="${c.id}" data-action="remove">Excluir</button></div>`;
      listaClientes.appendChild(d);
    });
  }

  // salvar cliente (o botão está no HTML)
  (function initSalvarCliente() {
    const btnSalvarCliente = clientesTab.querySelector('button.btn-primary');
    if (!btnSalvarCliente) return;
    btnSalvarCliente.addEventListener('click', () => {
      const inputs = clientesTab.querySelectorAll('input, textarea');
      const nome = inputs[0].value.trim();
      const telefone = inputs[1].value.trim();
      if (!nome || !telefone) { alert('Nome e telefone obrigatórios'); return; }
      const cliente = {
        id: Date.now(),
        nome, telefone,
        endereco: inputs[2].value.trim(),
        bairro: inputs[3].value.trim(),
        obs: inputs[4].value.trim(),
        notificacoes: inputs[5] ? inputs[5].checked : false
      };
      state.clientes.push(cliente);
      inputs.forEach(i => { if (i.type === 'checkbox') i.checked = false; else i.value = ''; });
      salvarLocal();
      renderizarClientes();
    });

    // ações de editar/excluir
    listaClientes.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = parseInt(btn.dataset.id);
      const action = btn.dataset.action;
      if (action === 'remove') {
        state.clientes = state.clientes.filter(c => c.id !== id);
        salvarLocal();
        renderizarClientes();
      } else if (action === 'edit') {
        // preenche o form
        const cliente = state.clientes.find(c => c.id === id);
        if (!cliente) return;
        const inputs = clientesTab.querySelectorAll('input, textarea');
        inputs[0].value = cliente.nome;
        inputs[1].value = cliente.telefone;
        inputs[2].value = cliente.endereco;
        inputs[3].value = cliente.bairro;
        inputs[4].value = cliente.obs;
        inputs[5].checked = !!cliente.notificacoes;
        // remove original e espera que ao salvar seja inserido novo (simplificação)
        state.clientes = state.clientes.filter(c => c.id !== id);
        salvarLocal();
        renderizarClientes();
      }
    });
  })();

  // ------------------------
  // 11) CUPONS
  // ------------------------
  const listaCupons = document.createElement('div');
  cuponsTab.appendChild(listaCupons);

  function renderizarCupons() {
    listaCupons.innerHTML = '';
    if (!state.cupons || state.cupons.length === 0) {
      listaCupons.innerHTML = '<p>Nenhum cupom criado.</p>';
      return;
    }
    state.cupons.forEach(c => {
      const d = document.createElement('div');
      d.className = 'cupom-item';
      d.innerHTML = `<div><strong>${c.codigo}</strong> - ${c.tipo} ${c.valor} <br> Validade: ${c.validade || '-'} | Limite: ${c.limite || '-'}</div><div><button class="btn-danger btn-small" data-id="${c.id}">Excluir</button></div>`;
      listaCupons.appendChild(d);
    });
  }

  (function initCriarCupom() {
    const btnCriarCupom = cuponsTab.querySelector('button.btn-primary');
    if (!btnCriarCupom) return;
    btnCriarCupom.addEventListener('click', () => {
      const inputs = cuponsTab.querySelectorAll('input, select, textarea');
      const codigo = inputs[0].value.trim();
      const tipo = inputs[1].value.trim();
      const valor = inputs[2].value.trim();
      if (!codigo || !valor) { alert('Preencha código e valor'); return; }
      const cupom = {
        id: Date.now(),
        codigo,
        tipo,
        valor,
        validade: inputs[3].value,
        minimo: inputs[4].value,
        limite: inputs[5].value,
        mensagem: inputs[6].value,
        ativo: inputs[7] ? inputs[7].checked : false
      };
      state.cupons.push(cupom);
      inputs.forEach(i => { if (i.type === 'checkbox') i.checked = false; else i.value = ''; });
      salvarLocal();
      renderizarCupons();
    });

    listaCupons.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = parseInt(btn.dataset.id);
      state.cupons = state.cupons.filter(c => c.id !== id);
      salvarLocal();
      renderizarCupons();
    });
  })();

  // ------------------------
  // 12) COBERTURA
  // ------------------------
  const listaBairros = document.createElement('div');
  coberturaTab.appendChild(listaBairros);

  function renderizarCobertura() {
    listaBairros.innerHTML = '';
    if (!state.cobertura || state.cobertura.length === 0) {
      listaBairros.innerHTML = '<p>Nenhum bairro cadastrado.</p>';
      return;
    }
    state.cobertura.forEach(b => {
      const d = document.createElement('div');
      d.className = 'bairro-item';
      d.innerHTML = `<div><strong>${b.nome}</strong> - R$ ${b.taxa} - ${b.tempo}min</div><div><button class="btn-danger btn-small" data-id="${b.id}">Excluir</button></div>`;
      listaBairros.appendChild(d);
    });
  }

  (function initAdicionarBairro() {
    const btn = coberturaTab.querySelector('button.btn-primary');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const inputs = coberturaTab.querySelectorAll('input');
      const nome = inputs[0].value.trim();
      const taxa = inputs[1].value.trim();
      const tempo = inputs[2].value.trim();
      if (!nome) return;
      state.cobertura.push({ id: Date.now(), nome, taxa, tempo });
      inputs.forEach(i => i.value = '');
      salvarLocal();
      renderizarCobertura();
    });

    listaBairros.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = parseInt(btn.dataset.id);
      state.cobertura = state.cobertura.filter(b => b.id !== id);
      salvarLocal();
      renderizarCobertura();
    });
  })();

  // ------------------------
  // 13) PUBLICIDADE
  // ------------------------
  (function initPublicidade() {
    const btnSalvarPublicidade = publicidadeTab.querySelector('button.btn-primary');
    if (!btnSalvarPublicidade) return;
    btnSalvarPublicidade.addEventListener('click', () => {
      const inputs = publicidadeTab.querySelectorAll('input, textarea');
      state.publicidade = {
        bannerTexto: inputs[0] ? inputs[0].value : '',
        bannerImg: inputs[1] ? inputs[1].value : '',
        bannerLink: inputs[2] ? inputs[2].value : '',
        carrossel: inputs[3] ? inputs[3].value.split('\n').map(l => l.trim()).filter(l => l) : [],
        instagram: inputs[4] ? inputs[4].value : '',
        facebook: inputs[5] ? inputs[5].value : '',
        whatsapp: inputs[6] ? inputs[6].value : ''
      };
      salvarLocal();
      alert('Publicidade salva!');
    });
  })();

  // ------------------------
  // 14) DADOS DA LOJA
  // ------------------------
  (function initDadosLoja() {
    const inputs = dadosLojaTab.querySelectorAll('input, textarea');
    if (!inputs) return;
    function salvarDadosLoja() {
      state.dadosLoja = {
        nome: inputs[0].value,
        telefone: inputs[1].value,
        pix: inputs[2].value,
        banco: inputs[3].value,
        endereco: inputs[4].value,
        logo: inputs[5].value,
        horarios: inputs[6].value
      };
      salvarLocal();
    }
    inputs.forEach(inp => inp.addEventListener('change', salvarDadosLoja));
  })();

  // ------------------------
  // 15) CUSTOMIZAR
  // ------------------------
  (function initCustomizar() {
    const inputs = customTab.querySelectorAll('input');
    if (!inputs || inputs.length === 0) return;
    inputs.forEach(inp => inp.addEventListener('change', () => {
      state.customizar = {
        corPrincipal: inputs[0].value,
        fonte: inputs[1].value,
        dark: inputs[2].checked,
        musica: inputs[3].value
      };
      salvarLocal();
    }));
  })();

  // ------------------------
  // 16) JSONBIN - publicar / importar / restaurar
  // ------------------------
  async function publicarDados() {
    if (!confirm('Publicar os dados no totem?')) return;
    const binId = binIdInput ? binIdInput.value.trim() : '';
    const masterKey = masterKeyInput ? masterKeyInput.value.trim() : '';
    if (!binId || !masterKey) { alert('Preencha BIN ID e Master Key'); return; }
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Master-Key': masterKey },
        body: JSON.stringify(state)
      });
      if (!res.ok) throw new Error(res.statusText || 'Erro ao publicar');
      alert('✅ Publicado com sucesso!');
    } catch (err) {
      console.error('Erro publicar:', err);
      alert('❌ Erro ao publicar. Veja console.');
    }
  }

  async function importarDados() {
    if (!confirm('Importar os dados do totem? Isso sobrescreverá os dados locais')) return;
    const binId = binIdInput ? binIdInput.value.trim() : '';
    const masterKey = masterKeyInput ? masterKeyInput.value.trim() : '';
    if (!binId || !masterKey) { alert('Preencha BIN ID e Master Key'); return; }
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        headers: { 'X-Master-Key': masterKey }
      });
      if (!res.ok) throw new Error(res.statusText || 'Erro ao importar');
      const data = await res.json();
      state = data.record || state;
      salvarLocal();
      // re-render todas as seções
      renderizarCategorias();
      renderizarProdutos();
      renderizarClientes();
      renderizarCupons();
      renderizarCobertura();
      renderizarModoVenda();
      alert('✅ Dados importados!');
    } catch (err) {
      console.error('Erro importar:', err);
      alert('❌ Erro ao importar. Veja console.');
    }
  }

  function restaurarPadrao() {
    const senha = prompt('Digite a senha (1234) para restaurar:');
    if (senha !== '1234') { if (senha !== null) alert('Senha incorreta'); return; }
    if (!confirm('Apagar todos os dados não publicados?')) return;
    state = { produtos: [], categorias: [], modoVenda: [], clientes: [], cupons: [], publicidade: {}, dadosLoja: {}, cobertura: [], customizar: {} };
    salvarLocal();
    renderizarCategorias();
    renderizarProdutos();
    renderizarClientes();
    renderizarCupons();
    renderizarCobertura();
    renderizarModoVenda();
    alert('Restaurado!');
  }

  // Event listeners de configurações
  if (btnPublicar) btnPublicar.addEventListener('click', publicarDados);
  if (btnImportar) btnImportar.addEventListener('click', importarDados);
  if (btnRestaurarPadrao) btnRestaurarPadrao.addEventListener('click', restaurarPadrao);
  if (btnExportar) btnExportar.addEventListener('click', () => {
    // exporta JSON para download local
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'painel-state.json';
    a.click();
  });

  // ------------------------
  // 17) Eventos globais e delegação
  // ------------------------
  // Produtos (editar/remover)
  listaProdutosContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'edit') editarProduto(id);
    if (action === 'remove') removerProdutoPorId(id);
  });
  // Produtos: adicionar
  if (btnAdicionarProduto) btnAdicionarProduto.addEventListener('click', adicionarOuAtualizarProduto);

  // Categorias
  if (formNovaCategoriaBtn) formNovaCategoriaBtn.addEventListener('click', adicionarCategoria);
  listaCategorias.addEventListener('click', (e) => {
    gerenciarSubcategorias(e);
    removerCategoria(e);
  });
  // Função para publicar no Totem via JSONBin
function publicarTotem() {
    const binId = document.getElementById("jsonbinId").value.trim();
    const masterKey = document.getElementById("masterKey").value.trim();

    if (!binId || !masterKey) {
        alert("⚠️ Configure o JSONBin ID e a Master Key antes de publicar!");
        return;
    }

    // Pega todos os dados salvos no state
    const data = JSON.stringify(state);

    fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": masterKey
        },
        body: data
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao publicar no JSONBin");
        return res.json();
    })
    .then(json => {
        alert("✅ Publicado com sucesso no Totem!");
        console.log("Resposta JSONBin:", json);
    })
    .catch(err => {
        console.error("Erro:", err);
        alert("❌ Falha ao publicar no Totem. Verifique suas credenciais.");
    });
}

// ================================
// 🔄 Preview em tempo real do Totem
// ================================

function atualizarPreview() {
  const iframe = document.getElementById("previewIframe");
  if (!iframe) return;

  // força recarregar o totem.html do estado atual
  const html = gerarTotemHTML();
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

// Função que gera o HTML do Totem baseado no state
function gerarTotemHTML() {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Totem - SeuNegócio</title>
    <style>
      body { font-family: Arial, sans-serif; background:#fafafa; margin:0; }
      header { display:flex; justify-content:space-between; align-items:center; padding:10px 20px; background:#3498db; color:#fff; }
      header img { height:50px; border-radius:6px; }
      #banner { text-align:center; padding:15px; }
      #banner img { max-width:100%; border-radius:10px; }
      #carrossel { display:flex; overflow-x:auto; gap:10px; padding:10px; }
      #carrossel img { height:100px; border-radius:8px; }
      #produtos { padding:15px; }
      .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:15px; }
      .produto-card { background:#fff; padding:10px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1); text-align:center; }
      .produto-card img { width:100%; height:120px; object-fit:cover; border-radius:8px; }
      .produto-card h3 { margin:10px 0 5px; font-size:16px; }
      .produto-card p { font-size:13px; color:#555; }
      .produto-card .preco { font-weight:bold; color:#e74c3c; display:block; margin-top:5px; }
      footer { text-align:center; padding:10px; background:#ecf0f1; font-size:14px; color:#555; }
    </style>
  </head>
  <body>
    <header>
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${state.dadosLoja?.logo || ""}" alt="Logo">
        <h1>${state.dadosLoja?.nome || "Minha Loja"}</h1>
      </div>
      <div>
        <span>${state.dadosLoja?.telefone || ""}</span><br>
        <span>${state.dadosLoja?.pix || ""}</span>
      </div>
    </header>

    <main>
      <section id="banner">
        <h2>${state.publicidade?.texto || ""}</h2>
        ${state.publicidade?.bannerImg ? `<img src="${state.publicidade.bannerImg}" alt="Banner">` : ""}
      </section>

      <section id="carrossel">
        ${(state.publicidade?.carrossel || []).map(url => `<img src="${url}" alt="Carrossel">`).join("")}
      </section>

      <section id="produtos">
        <h2>Produtos</h2>
        <div class="grid">
          ${(state.produtos || []).filter(p => p.ativo).map(prod => `
            <div class="produto-card">
              <img src="${prod.imagem}" alt="${prod.nome}">
              <h3>${prod.nome}</h3>
              <p>${prod.descricao || ""}</p>
              <span class="preco">R$ ${prod.preco}</span>
            </div>
          `).join("")}
        </div>
      </section>
    </main>

    <footer>
      <p>${state.dadosLoja?.endereco || ""}</p>
      <p>${state.dadosLoja?.horario || ""}</p>
    </footer>
  </body>
  </html>
  `;
}

// Sempre que salvar algo → atualizar Preview
function atualizarTudo() {
  salvarState();
  atualizarPreview();
}

// Chama uma vez ao abrir
document.addEventListener("DOMContentLoaded", atualizarPreview);

  // Inicialização de render
  setupTabs();
  setupDashboardChart();
  renderizarCategorias();
  renderizarProdutos();
  renderizarClientes();
  renderizarCupons();
  renderizarCobertura();
  renderizarModoVenda();
  atualizarPreview();

  // Debug rápido: mostra erro no console se algo falhar ao carregar
  window.addEventListener('error', (ev) => {
    console.error('Erro JS:', ev.error || ev.message);
  });

}); // end DOMContentLoaded
