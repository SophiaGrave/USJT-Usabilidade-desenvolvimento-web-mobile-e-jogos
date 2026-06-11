// ============================================================
//  api.js — Consumo da API dummyjson + Makeup API
// ============================================================

const API_BASE          = 'https://dummyjson.com/products';
const MAKEUP_BASE       = 'https://makeup-api.herokuapp.com/api/v1/products.json';
const CATEGORIAS_ATIVAS = ['beauty', 'skin-care'];
const COTACAO_DOLAR     = 5.70;

function converterParaReal(preco) {
  return parseFloat((preco * COTACAO_DOLAR).toFixed(2));
}

// Testa se uma URL de imagem carrega de verdade
function testarImagem(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // timeout de 4s pra não travar
    setTimeout(() => resolve(false), 4000);
  });
}

async function carregarDummyJSON() {
  const resultados = await Promise.all(
    CATEGORIAS_ATIVAS.map(cat =>
      fetch(`${API_BASE}/category/${cat}?limit=100`)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => data.products.map(p => ({ ...p, price: converterParaReal(p.price) })))
    )
  );
  return resultados.flat();
}

async function carregarMakeup() {
  const tipos = ['lipstick', 'foundation', 'eyeshadow', 'blush', 'mascara'];

  const resultados = await Promise.all(
    tipos.map(tipo =>
      fetch(`${MAKEUP_BASE}?product_type=${tipo}`)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(produtos =>
          produtos
            .filter(p => p.image_link && p.price && parseFloat(p.price) > 0)
            .slice(0, 20) // pega 20 por tipo pra ter margem após filtrar imagens
            .map(p => ({
              id:                 `makeup_${p.id}`,
              title:              p.name,
              price:              converterParaReal(parseFloat(p.price)),
              thumbnail:          p.image_link,
              category:           { name: p.product_type, slug: p.product_type },
              rating:             parseFloat(p.rating) || 4.0,
              discountPercentage: 0,
              brand:              p.brand || '',
            }))
        )
    )
  );

  const todos = resultados.flat();

  // Testa todas as imagens em paralelo e filtra as quebradas
  const testes = await Promise.all(todos.map(p => testarImagem(p.thumbnail)));
  return todos.filter((_, i) => testes[i]);
}

async function carregarProdutos() {
  const [dummy, makeup] = await Promise.all([
    carregarDummyJSON(),
    carregarMakeup().catch(() => [])
  ]);
  return [...dummy, ...makeup];
}

async function carregarCategorias() {
  return [
    { name: 'Beauty',      slug: 'beauty'     },
    { name: 'Skin Care',   slug: 'skin-care'  },
    { name: 'Lipstick',    slug: 'lipstick'   },
    { name: 'Foundation',  slug: 'foundation' },
    { name: 'Eyeshadow',   slug: 'eyeshadow'  },
    { name: 'Blush',       slug: 'blush'      },
    { name: 'Mascara',     slug: 'mascara'    },
  ];
}