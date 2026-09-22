/* ══════════════════════════════════════════════════════════
   OPEN FOOD FACTS + CÓDIGO DE BARRAS

   Banco aberto e gratuito, sem chave e sem cadastro, com
   versão brasileira. Substitui o cadastro manual de produto
   industrializado: aponta a câmera para o código de barras e
   o produto entra com os macros do rótulo.

   Tudo que é escaneado vira alimento próprio no aparelho, e
   por isso continua funcionando offline depois.
   ══════════════════════════════════════════════════════════ */

const OFF_BASE = 'https://br.openfoodfacts.org';
const OFF_CAMPOS = 'code,product_name,product_name_pt,brands,quantity,serving_size,nutriments';

/* Converte o registro do Open Food Facts no formato do app.
   Devolve null quando faltam os macros — produto sem rótulo
   preenchido é pior que produto nenhum. */
function ofParaAlimento(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  const num = v => (v == null || isNaN(+v)) ? null : +(+v).toFixed(1);

  const prot = num(n['proteins_100g']);
  const carb = num(n['carbohydrates_100g']);
  const gord = num(n['fat_100g']);
  if (prot == null || carb == null || gord == null) return null;

  const nome = (p.product_name_pt || p.product_name || '').trim();
  if (!nome) return null;
  const marca = (p.brands || '').split(',')[0].trim();

  const item = {
    n: marca && !nome.toLowerCase().includes(marca.toLowerCase()) ? nome + ' (' + marca + ')' : nome,
    p: prot, c: carb, g: gord,
    cat: 'Escaneados', codigo: p.code
  };
  const alc = num(n['alcohol_100g']);
  if (alc) item.alc = alc;

  // porção do rótulo vira medida caseira
  const s = String(p.serving_size || '');
  const m = s.match(/([\d.,]+)\s*(g|ml)/i);
  if (m) {
    const gramas = parseFloat(m[1].replace(',', '.'));
    if (gramas > 0 && gramas < 2000) { item.un = Math.round(gramas); item.unNome = 'porção'; }
  }
  return item;
}

/* Busca por código de barras. */
async function ofPorCodigo(codigo) {
  const url = OFF_BASE + '/api/v2/product/' + encodeURIComponent(codigo) + '.json?fields=' + OFF_CAMPOS;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('Não consegui consultar o banco de produtos (' + r.status + ').');
  const j = await r.json();
  if (j.status !== 1 || !j.product) throw new Error('Código não encontrado no banco. Cadastre o produto manualmente.');
  const a = ofParaAlimento(j.product);
  if (!a) throw new Error('Produto encontrado, mas sem tabela nutricional preenchida no banco.');
  return a;
}

/* Busca por nome, para quando não há código à mão. */
async function ofPorNome(termo) {
  const url = OFF_BASE + '/cgi/search.pl?search_terms=' + encodeURIComponent(termo)
            + '&search_simple=1&action=process&json=1&page_size=24&fields=' + OFF_CAMPOS;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('Busca indisponível no momento.');
  const j = await r.json();
  return (j.products || []).map(ofParaAlimento).filter(Boolean).slice(0, 15);
}

/* ── Leitor de código de barras pela câmera ──────────────
   Usa a BarcodeDetector do próprio navegador. Onde ela não
   existe, o app cai para digitação manual do código, que
   funciona em qualquer aparelho. */

const temDetector = () => typeof window.BarcodeDetector !== 'undefined';

async function formatosSuportados() {
  if (!temDetector()) return [];
  try { return await window.BarcodeDetector.getSupportedFormats(); } catch (e) { return []; }
}

function criarLeitor(video, aoLer, aoErro) {
  let parar = false, stream = null, det = null, timer = null;

  async function iniciar() {
    if (!temDetector()) { aoErro(new Error('sem-detector')); return; }
    try {
      det = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'itf']
      });
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false
      });
      video.srcObject = stream;
      video.setAttribute('playsinline', '');
      await video.play();
      laco();
    } catch (e) {
      aoErro(e.name === 'NotAllowedError'
        ? new Error('Permissão de câmera negada.')
        : new Error('Não consegui abrir a câmera.'));
    }
  }

  async function laco() {
    if (parar) return;
    try {
      const achados = await det.detect(video);
      const bom = achados.find(x => x.rawValue && /^\d{8,14}$/.test(x.rawValue));
      if (bom) { encerrar(); aoLer(bom.rawValue); return; }
    } catch (e) { /* frame ruim: segue */ }
    timer = setTimeout(laco, 220);
  }

  function encerrar() {
    parar = true;
    clearTimeout(timer);
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  return { iniciar, encerrar };
}
