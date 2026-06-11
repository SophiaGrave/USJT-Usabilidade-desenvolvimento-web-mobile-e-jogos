// ============================================================
//  app.js — Lógica principal do Catálogo
// ============================================================

let todosProdutos   = [];
let categorias      = [];
let filtroCategoria = 'all';
let termoBusca      = '';
let abaAtiva        = 'catalogo';

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  configurarNavegacao();
  configurarBusca();
  await inicializar();
});

async function inicializar() {
  mostrarLoader(true);
  try {
    [todosProdutos, categorias] = await Promise.all([
      carregarProdutos(),
      carregarCategorias(),
    ]);
    renderizarCategorias();
    renderizarProdutos();
    atualizarBadgeCarrinho();
  } catch (e) {
    mostrarErro('Não foi possível carregar os produtos. Verifique sua conexão com a internet.');
  } finally {
    mostrarLoader(false);
  }
}

// ── Navegação ─────────────────────────────────────────────────
function configurarNavegacao() {
  document.getElementById('btn-catalogo').addEventListener('click',  () => mudarAba('catalogo'));
  document.getElementById('btn-favoritos').addEventListener('click', () => mudarAba('favoritos'));
  document.getElementById('btn-carrinho').addEventListener('click',  () => mudarAba('carrinho'));
}

function mudarAba(aba) {
  abaAtiva = aba;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-${aba}`).classList.add('active');
  ['catalogo','favoritos','carrinho'].forEach(s => {
    document.getElementById(`secao-${s}`).style.display = s === aba ? 'block' : 'none';
  });
  if (aba === 'favoritos') renderizarFavoritos();
  if (aba === 'carrinho')  renderizarCarrinho();
}

// ── Busca ─────────────────────────────────────────────────────
function configurarBusca() {
  document.getElementById('busca').addEventListener('input', e => {
    termoBusca = e.target.value.trim().toLowerCase();
    renderizarProdutos();
  });
}

// ── Categorias ────────────────────────────────────────────────
function renderizarCategorias() {
  const container = document.getElementById('filtro-categorias');
  container.innerHTML = '';
  container.appendChild(criarBtnCategoria('Todos', 'all'));
  categorias.forEach(cat => {
    const nome = typeof cat === 'string' ? cat : cat.name;
    const slug = typeof cat === 'string' ? cat : cat.slug;
    container.appendChild(criarBtnCategoria(capitalizar(nome), slug));
  });
}

function criarBtnCategoria(label, valor) {
  const btn = document.createElement('button');
  btn.className = 'cat-pill' + (valor === filtroCategoria ? ' active' : '');
  btn.textContent = label;
  btn.addEventListener('click', () => {
    filtroCategoria = valor;
    document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderizarProdutos();
  });
  return btn;
}

// ── Produtos ──────────────────────────────────────────────────
function produtosFiltrados() {
  return todosProdutos.filter(p => {
    const cat = typeof p.category === 'string' ? p.category : (p.category?.slug || p.category?.name || '');
    const catOk   = filtroCategoria === 'all' || cat === filtroCategoria;
    const buscaOk = p.title.toLowerCase().includes(termoBusca);
    return catOk && buscaOk;
  });
}

function renderizarProdutos() {
  const lista = produtosFiltrados();
  const grid  = document.getElementById('grid-produtos');
  const vazio = document.getElementById('vazio-catalogo');
  grid.innerHTML = '';
  if (lista.length === 0) { vazio.style.display = 'flex'; return; }
  vazio.style.display = 'none';
  lista.forEach((p, i) => {
    const card = criarCard(p);
    card.style.animationDelay = `${Math.min(i * 35, 500)}ms`;
    grid.appendChild(card);
  });
}

function criarCard(produto) {
  const fav = isFavorito(produto.id);
  const catNome = capitalizar(typeof produto.category === 'string' ? produto.category : (produto.category?.name || ''));
  const precoOriginal = produto.discountPercentage > 0
    ? `<s class="preco-old">R$ ${(produto.price / (1 - produto.discountPercentage / 100)).toFixed(2)}</s>` : '';

  const col = document.createElement('div');
  col.className = 'card-col';
  col.innerHTML = `
    <article class="prod-card">
      <div class="card-img-wrap">
        <img src="${produto.thumbnail}" alt="${produto.title}" loading="lazy"
  onerror="this.src='https://placehold.co/400x400/f9f0f5/c084a0?text=Sem+Foto'" />
        ${produto.discountPercentage > 0 ? `<span class="badge-off">-${Math.round(produto.discountPercentage)}%</span>` : ''}
        <button class="btn-fav ${fav ? 'on' : ''}" data-id="${produto.id}" aria-label="Favoritar">
          <svg viewBox="0 0 24 24" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div class="card-body">
        <span class="card-cat">${catNome}</span>
        <h3 class="card-nome">${produto.title}</h3>
        <div class="card-stars">${estrelas(produto.rating)}<span class="rating-num">${produto.rating?.toFixed(1)}</span></div>
        <div class="card-preco-row">
          ${precoOriginal}
          <span class="preco-atual">R$ ${produto.price.toFixed(2)}</span>
        </div>
        <button class="btn-add-cart">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Adicionar ao Carrinho
        </button>
      </div>
    </article>`;

  col.querySelector('.btn-fav').addEventListener('click', e => { e.stopPropagation(); onFav(produto.id, col); });
  col.querySelector('.btn-add-cart').addEventListener('click', () => onAddCart(produto, col));
  return col;
}

function estrelas(r) {
  let h = '';
  for (let i = 1; i <= 5; i++) {
    const fill = i <= Math.round(r) ? '#f59e0b' : '#d1d5db';
    h += `<svg width="12" height="12" viewBox="0 0 24 24" fill="${fill}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  }
  return h;
}

// ── Favoritos ─────────────────────────────────────────────────
function onFav(id, col) {
  toggleFavorito(id);
  const on  = isFavorito(id);
  const btn = col.querySelector('.btn-fav');
  btn.classList.toggle('on', on);
  btn.querySelector('path').setAttribute('fill', on ? 'currentColor' : 'none');
  btn.classList.add('pulsar');
  setTimeout(() => btn.classList.remove('pulsar'), 350);
  toast(on ? '❤️ Adicionado aos favoritos!' : 'Removido dos favoritos.');
}

function renderizarFavoritos() {
  const ids  = getFavoritos();
  const grid = document.getElementById('grid-favoritos');
  const vazio= document.getElementById('vazio-favoritos');
  grid.innerHTML = '';
  const favs = todosProdutos.filter(p => ids.includes(p.id));
  if (!favs.length) { vazio.style.display = 'flex'; return; }
  vazio.style.display = 'none';
  favs.forEach(p => grid.appendChild(criarCard(p)));
}

// ── Carrinho ──────────────────────────────────────────────────
function onAddCart(produto, col) {
  adicionarAoCarrinho(produto);
  atualizarBadgeCarrinho();
  toast('🛒 Produto adicionado!');
  const btn = col.querySelector('.btn-add-cart');
  btn.classList.add('ok');
  btn.textContent = '✓ Adicionado';
  setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Adicionar ao Carrinho`; }, 1500);
}

function renderizarCarrinho() {
  const itens  = getCarrinho();
  const lista  = document.getElementById('carrinho-lista');
  const vazio  = document.getElementById('vazio-carrinho');
  const resumo = document.getElementById('carrinho-resumo');
  lista.innerHTML = '';

  if (!itens.length) {
    vazio.style.display  = 'flex';
    resumo.style.display = 'none';
    return;
  }
  vazio.style.display  = 'none';
  resumo.style.display = 'grid';

  itens.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <img src="${item.thumbnail}" alt="${item.title}" />
      <div class="cart-info">
        <span class="cart-nome">${item.title}</span>
        <span class="cart-unit">R$ ${item.price.toFixed(2)} / un.</span>
      </div>
      <div class="cart-qtd">
        <button class="qtd-btn" data-id="${item.id}" data-delta="-1">−</button>
        <span>${item.quantidade}</span>
        <button class="qtd-btn" data-id="${item.id}" data-delta="1">+</button>
      </div>
      <span class="cart-subtotal">R$ ${(item.price * item.quantidade).toFixed(2)}</span>
      <button class="cart-del" data-id="${item.id}" title="Remover">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
    row.querySelectorAll('.qtd-btn').forEach(b => b.addEventListener('click', () => {
      alterarQuantidade(item.id, +b.dataset.delta);
      renderizarCarrinho(); atualizarBadgeCarrinho();
    }));
    row.querySelector('.cart-del').addEventListener('click', () => {
      removerDoCarrinho(item.id);
      renderizarCarrinho(); atualizarBadgeCarrinho();
    });
    lista.appendChild(row);
  });

  const total = totalCarrinho();
  document.getElementById('resumo-subtotal').textContent = `R$ ${total.toFixed(2)}`;
  document.getElementById('resumo-total').textContent    = `R$ ${total.toFixed(2)}`;

  document.getElementById('btn-limpar').onclick = () => { limparCarrinho(); renderizarCarrinho(); atualizarBadgeCarrinho(); };
  document.getElementById('btn-finalizar').onclick = () => {
    limparCarrinho(); renderizarCarrinho(); atualizarBadgeCarrinho();
    toast('✅ Compra finalizada! Obrigado pela preferência!');
  };
}

function atualizarBadgeCarrinho() {
  const qtd   = quantidadeCarrinho();
  const badge = document.getElementById('badge-carrinho');
  badge.textContent    = qtd;
  badge.style.display  = qtd > 0 ? 'inline-flex' : 'none';
}

// ── Helpers ───────────────────────────────────────────────────
function mostrarLoader(show) {
  document.getElementById('loader').style.display            = show ? 'flex'  : 'none';
  document.getElementById('conteudo-principal').style.display= show ? 'none' : 'block';
}
function mostrarErro(msg) {
  const el = document.getElementById('erro');
  el.textContent    = msg;
  el.style.display  = 'flex';
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2600);
}
function capitalizar(s) {
  return (s || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
