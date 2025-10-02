document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIG ---
  // ATENÇÃO: Estes dados devem ser os mesmos do seu painel.
  const BIN_ID = '68de4a73d0ea881f40929dca';
  const API_KEY = '$2a$10$GOducLqAZIq2MZScJ2RNRON5lbkQx0SSfNc5/nJQQ/pFsRtAsBRtK';
  const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;

  // --- SELECTORS ---
  const carrosselDiv = document.getElementById('carrossel');
  const musicaDiv = document.getElementById('musica');

  // --- FUNCTIONS ---
  
  function montarCarrossel(produtos = []) {
    if (produtos.length === 0) {
      carrosselDiv.innerHTML = '<p>Nenhum produto encontrado. Configure o painel e publique os dados.</p>';
      return;
    }

    carrosselDiv.innerHTML = ''; // Limpa o conteúdo
    produtos.forEach(produto => {
      const precoFormatado = parseFloat(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      const produtoHTML = `
        <div class="produto">
          <img src="${produto.imagem || 'https://via.placeholder.com/300x200'}" alt="${produto.nome}">
          <h3>${produto.nome}</h3>
          <p class="descricao">${produto.descricao || ''}</p>
          <p class="preco">${precoFormatado}</p>
        </div>
      `;
      carrosselDiv.innerHTML += produtoHTML;
    });
  }

  function aplicarCustomizacao(customizar = {}) {
    const root = document.documentElement;
    
    // Aplica cores
    if (customizar.corPrincipal) {
      root.style.setProperty('--cor-principal', customizar.corPrincipal);
    }

    // Aplica modo escuro
    if (customizar.modoEscuro) {
      document.body.classList.add('dark-mode');
    }

    // Aplica música
    if (customizar.musicaAtiva && customizar.musicaFundo) {
      // Converte link do YouTube normal para link de embed
      const videoId = customizar.musicaFundo.split('v=')[1];
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId.split('&')[0]}?autoplay=1&loop=1&controls=0&mute=1`;
        musicaDiv.innerHTML = `<iframe width="50" height="30" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      }
    }
  }

  async function carregarDados() {
    try {
      const res = await fetch(BASE_URL, {
        headers: { 'X-Master-Key': API_KEY }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const jsonResponse = await res.json();
      const dados = jsonResponse.record;
      
      // Monta a tela com os dados carregados
      montarCarrossel(dados.produtos);
      aplicarCustomizacao(dados.customizar);

    } catch (err) {
      console.error('Erro ao carregar dados do totem:', err);
      carrosselDiv.innerHTML = '<p>Ocorreu um erro ao carregar o cardápio. Tente novamente mais tarde.</p>';
    }
  }

  // --- INITIALIZATION ---
  carregarDados();
});

// ======= SEUNEGOCIO TOTEM - JS COMPLETO =======

// Estado inicial
let state = JSON.parse(localStorage.getItem("seunegocio_state")) || {
  dadosLoja: {
    nome: "Minha Loja",
    telefone: "",
    pix: "",
    endereco: "",
    horario: "",
    logo: ""
  },
  publicidade: {
    texto: "",
    bannerImg: "",
    carrossel: []
  },
  produtos: []
};

// ================= FUNÇÕES ==================

// Salvar estado no localStorage
function salvarState() {
  localStorage.setItem("seunegocio_state", JSON.stringify(state));
  alert("Dados salvos com sucesso!");
  atualizarTotem();
}

// Atualizar totém com os dados do state
function atualizarTotem() {
  // Dados da loja
  document.getElementById("lojaNome").textContent = state.dadosLoja.nome || "Minha Loja";
  document.getElementById("lojaTelefone").textContent = state.dadosLoja.telefone || "";
  document.getElementById("lojaPix").textContent = state.dadosLoja.pix || "";
  document.getElementById("lojaEndereco").textContent = state.dadosLoja.endereco || "";
  document.getElementById("lojaHorario").textContent = state.dadosLoja.horario || "";
  document.getElementById("lojaLogo").src = state.dadosLoja.logo || "";

  // Banner
  document.getElementById("bannerTexto").textContent = state.publicidade.texto || "";
  document.getElementById("bannerImagem").src = state.publicidade.bannerImg || "";

  // Carrossel
  const carrossel = document.getElementById("carrosselContainer");
  carrossel.innerHTML = "";
  if (state.publicidade.carrossel.length) {
    state.publicidade.carrossel.forEach(url => {
      const img = document.createElement("img");
      img.src = url;
      carrossel.appendChild(img);
    });
  }

  // Produtos
  const produtosContainer = document.getElementById("produtosContainer");
  produtosContainer.innerHTML = "";
  if (state.produtos.length) {
    state.produtos.forEach(prod => {
      if (prod.ativo) {
        const card = document.createElement("div");
        card.className = "produto-card";
        card.innerHTML = `
          <img src="${prod.imagem}" alt="${prod.nome}">
          <h3>${prod.nome}</h3>
          <p>${prod.descricao || ""}</p>
          <span class="preco">R$ ${prod.preco}</span>
        `;
        produtosContainer.appendChild(card);
      }
    });
  }
}

// Adicionar produto
function adicionarProduto(nome, descricao, preco, imagem, ativo = true) {
  state.produtos.push({ nome, descricao, preco, imagem, ativo });
  salvarState();
}

// Editar dados da loja
function atualizarDadosLoja(dados) {
  state.dadosLoja = { ...state.dadosLoja, ...dados };
  salvarState();
}

// Atualizar banner
function atualizarBanner(texto, bannerImg, carrossel = []) {
  state.publicidade.texto = texto;
  state.publicidade.bannerImg = bannerImg;
  state.publicidade.carrossel = carrossel;
  salvarState();
}

// Exportar JSON
function exportarJSON() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "seunegocio.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ================= EXECUÇÃO ==================
atualizarTotem();
