// ============================================================
//  storage.js — Persistência com localStorage
// ============================================================

const FAVORITOS_KEY = 'catalogo_favoritos';
const CARRINHO_KEY  = 'catalogo_carrinho';

// ── Favoritos ────────────────────────────────────────────────
function getFavoritos() {
  return JSON.parse(localStorage.getItem(FAVORITOS_KEY) || '[]');
}
function salvarFavoritos(ids) {
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(ids));
}
function toggleFavorito(id) {
  const favs = getFavoritos();
  const idx  = favs.indexOf(id);
  if (idx === -1) favs.push(id); else favs.splice(idx, 1);
  salvarFavoritos(favs);
  return favs;
}
function isFavorito(id) {
  return getFavoritos().includes(id);
}

// ── Carrinho ─────────────────────────────────────────────────
function getCarrinho() {
  return JSON.parse(localStorage.getItem(CARRINHO_KEY) || '[]');
}
function salvarCarrinho(itens) {
  localStorage.setItem(CARRINHO_KEY, JSON.stringify(itens));
}
function adicionarAoCarrinho(produto) {
  const carrinho  = getCarrinho();
  const existente = carrinho.find(i => i.id === produto.id);
  if (existente) existente.quantidade += 1;
  else carrinho.push({ ...produto, quantidade: 1 });
  salvarCarrinho(carrinho);
  return carrinho;
}
function removerDoCarrinho(id) {
  const carrinho = getCarrinho().filter(i => i.id !== id);
  salvarCarrinho(carrinho);
  return carrinho;
}
function alterarQuantidade(id, delta) {
  const carrinho = getCarrinho();
  const item     = carrinho.find(i => i.id === id);
  if (!item) return carrinho;
  item.quantidade += delta;
  if (item.quantidade <= 0) return removerDoCarrinho(id);
  salvarCarrinho(carrinho);
  return carrinho;
}
function limparCarrinho()     { salvarCarrinho([]); return []; }
function totalCarrinho()      { return getCarrinho().reduce((a, i) => a + i.price * i.quantidade, 0); }
function quantidadeCarrinho() { return getCarrinho().reduce((a, i) => a + i.quantidade, 0); }
