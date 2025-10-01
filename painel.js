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


// Produtos
function renderProdutos() {
const cont = $('#listaProdutosContainer');
cont.innerHTML = '';
if (!state.produtos.length) { cont.innerHTML = '<p>Nenhum produto cadastrado.</p>'; return; }
state.produtos.forEach(prod => {
const div = document.createElement('div'); div.className = 'product-item';
const img = document.createElement('img'); img.src = prod.imagem || 'https://via.placeholder.com/50';
const info = document.createElement('div'); info.innerHTML = `<strong>${prod.nome}</strong><br>${fmtBR(prod.preco)}`;
const btn = document.createElement('button'); btn.textContent = 'Remover'; btn.className = 'btn-danger'; btn.onclick = () => { state.produtos = state.produtos.filter(p => p.id != prod.id); saveState(); renderAll(); };
div.append(img, info, btn);
cont.appendChild(div);
});
}
function addProduto() {
const nome = $('#prodNome').value.trim();
let preco = $('#prodPreco').value.trim().replace('.', '').replace(',', '.');
preco = parseFloat(preco);
if (!nome || isNaN(preco)) { alert('Preencha nome e preço válidos.'); return; }
state.produtos.push({ id: genId(), nome, preco, imagem: $('#prodImagem').value.trim(), descricao: $('#prodDescricao').value.trim(), categoriaId: $('#prodCategoria').value, modoVendaId: $('#prodModoVenda').value });
saveState(); renderAll();
$('#prodNome').value = $('#prodPreco').value = $('#prodImagem').value = $('#prodDescricao').value = '';
}


// Export/Import
function exportJson() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'seunegocio.json'; a.click(); }
function importJson(file) { const r = new FileReader(); r.onload = (e) => { state = JSON.parse(e.target.result); saveState(); renderAll(); }; r.readAsText(file); }


// Publicar
async function publicar() {
const bin = $('#binId').value; const key = $('#masterKey').value;
if (!bin || !key) return alert('Informe BIN ID e Master Key.');
try {
await fetch(`https://api.jsonbin.io/v3/b/${bin}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': key }, body: JSON.stringify(state) });
alert('✅ Publicado com sucesso!');
} catch (e) { alert('Erro ao publicar: ' + e.message); }
}


// Menu Tabs
function setupTabs() {
const TABS = [ 'dashboard','categorias','modo-venda','produtos','clientes','cupons','publicidade','dados-loja','customizar','config'];
TABS.forEach(id => { const btn = document.createElement('button'); btn.dataset.tab = id; btn.textContent = id; $('#menu').appendChild(btn); });
$('#menu').addEventListener('click', e => { if (e.target.tagName === 'BUTTON') { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); $('#' + e.target.dataset.tab).classList.add('active'); document.querySelectorAll('#menu button').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); } });
$('#menu button').click();
}


// Listeners
$('#btnCriarCategoria').onclick = () => addCategoria($('#catNome').value);
$('#btnAdicionarModoVenda').onclick = () => addModo($('#modoVendaNome').value, $('#modoVendaFracao').value);
$('#btnAdicionarProduto').onclick = addProduto;
$('#btnExportarJson').onclick = exportJson;
$('#fileImportJson').onchange = (e) => importJson(e.target.files[0]);
$('#btnPublicar').onclick = publicar;
$('#btnRestaurarPadrao').onclick = () => { if (confirm('Restaurar tudo?')) { state = { produtos: [], categorias: [], modosVenda: [], customizar: {}, dadosLoja: {} }; saveState(); renderAll(); } };


// Init
loadState(); setupTabs(); renderAll();


function renderAll() { renderCategorias(); renderModos(); renderProdutos(); }
});
