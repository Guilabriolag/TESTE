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
